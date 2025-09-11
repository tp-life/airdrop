import {
  ethers,
  JsonRpcProvider,
  Wallet as EthWallet,
  Contract,
  Interface,
  HDNodeWallet,
  TransactionRequest,
} from "ethers";

// ✅ 通用 ERC20 ABI（最小可用版本）
export const ERC20_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function transfer(address,uint256) returns (bool)",
  "function approve(address,uint256) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "function nonces(address owner) view returns (uint256)",
  "function DOMAIN_SEPARATOR() view returns (bytes32)",
  "function permit(address owner,address spender,uint256 value,uint256 deadline,uint8 v,bytes32 r,bytes32 s)",
  "function mint(address _to,uint256 _amount)",
];

// ✅ ERC721 简化 ABI
const ERC721_ABI = [
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function safeTransferFrom(address from, address to, uint256 tokenId)",
];
export type GasMode = "legacy" | "eip1559";

export interface GasOptions {
  bumpPercent?: number; // gasLimit 增加比例（%）
  priorityBumpPercent?: number; // 小费增加比例（%）
  extra?: bigint; // 额外固定增加
  margin?: bigint; // 确保 maxFee > priority 的安全边际
}

export class EvmWallet {
  private provider: JsonRpcProvider;
  signer: EthWallet | HDNodeWallet;
  private gasMode: GasMode;
  private fallbackGas = 100000n;
  private gasOptions: GasOptions;

  constructor(
    rpc: string,
    options: {
      privateKey?: string;
      mnemonic?: string;
      gasMode?: GasMode;
      fallbackGas?: bigint;
      gasOptions?: GasOptions; // ✅ 新增
    } = {},
  ) {
    this.provider = new ethers.JsonRpcProvider(rpc);
    this.gasMode = options.gasMode ?? "eip1559";
    this.fallbackGas = options.fallbackGas ?? this.fallbackGas;

    // ✅ 默认 gasOptions
    this.gasOptions = {
      bumpPercent: options.gasOptions?.bumpPercent ?? 10,
      priorityBumpPercent: options.gasOptions?.priorityBumpPercent ?? 20,
      extra: options.gasOptions?.extra ?? 0n,
      margin: options.gasOptions?.margin ?? 1n, // 确保 maxFee > priority
    };

    if (options.mnemonic) {
      this.signer = ethers.Wallet.fromPhrase(options.mnemonic).connect(
        this.provider,
      );
    } else if (options.privateKey) {
      this.signer = new ethers.Wallet(options.privateKey, this.provider);
    } else {
      throw new Error("必须提供 mnemonic 或 privateKey");
    }
  }

  /** 获取地址 */
  getAddress() {
    return this.signer.address;
  }

  /**
   * 发送交易（含 gas 策略 + 超时机制 + 自动重试）
   * @param tx 交易请求
   * @param timeoutMs 超时时间，默认 60 秒
   * @param maxRetries 最大重试次数，默认 3
   */
  async sendTx(
    tx: TransactionRequest,
    timeoutMs = 90000,
    maxRetries = 3,
  ): Promise<ethers.TransactionReceipt> {
    let filledTx = await this._fillGas(tx);

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const txRes = await this.signer.sendTransaction(filledTx);
        return Promise.race([
          txRes.wait(),
          new Promise((_, reject) =>
            setTimeout(
              () => reject(new Error("Transaction Timeout")),
              timeoutMs,
            ),
          ),
        ]) as Promise<ethers.TransactionReceipt>;
      } catch (err: any) {
        const msg = err.message || err.toString();
        // nonce 错误自动重试
        if (
          (msg.includes("nonce too low") ||
            msg.includes("replacement transaction underpriced") ||
            msg.includes("already known")) &&
          attempt < maxRetries
        ) {
          console.warn(
            `⚠️ Nonce error detected, retrying (${attempt + 1}/${maxRetries})...`,
          );
          // 刷新 nonce 并重新填充 gas
          const nonce = await this.provider.getTransactionCount(
            this.signer.address,
            "latest",
          );
          filledTx = await this._fillGas({ ...tx, nonce });
          // 小延迟后重试
          await new Promise((r) => setTimeout(r, 500 + 300 * attempt));
          continue;
        }
        throw err;
      }
    }

    throw new Error("Exceeded retry limit");
  }

  /** Gas 策略 */
  private async _fillGas(tx: TransactionRequest): Promise<TransactionRequest> {
    let estimateGas = this.fallbackGas;
    try {
      estimateGas = await this.signer.estimateGas(tx);
    } catch {}

    const bump = BigInt(this.gasOptions.bumpPercent ?? 0);
    const prioBump = BigInt(this.gasOptions.priorityBumpPercent ?? 0);
    const extra = this.gasOptions.extra ?? 0n;
    const margin = this.gasOptions.margin ?? 1n;

    const gasLimit = (estimateGas * (100n + bump)) / 100n + extra;

    if (this.gasMode === "legacy") {
      const fee = await this.provider.getFeeData();
      const gasPrice = fee.gasPrice
        ? (fee.gasPrice * (100n + bump)) / 100n
        : undefined;
      return { ...tx, gasLimit, gasPrice };
    } else {
      const fee = await this.provider.getFeeData();

      let maxPriority: bigint | undefined =
        fee.maxPriorityFeePerGas !== undefined
          ? (fee.maxPriorityFeePerGas * (100n + prioBump)) / 100n
          : undefined;

      let maxFee: bigint | undefined =
        fee.maxFeePerGas !== undefined
          ? (fee.maxFeePerGas * (100n + bump)) / 100n
          : undefined;

      if (maxPriority && maxFee) {
        if (maxPriority >= maxFee) {
          maxFee = maxPriority + margin; // 确保 maxFee > priority
        }
      } else if (maxPriority && !maxFee) {
        maxFee = maxPriority * 2n; // 兜底
      } else if (!maxPriority && maxFee) {
        maxPriority = maxFee / 10n; // 默认取 10%
      } else {
        const fee = await this.provider.getFeeData();
        const gasPrice = fee.gasPrice;
        return { ...tx, gasLimit, gasPrice };
      }

      return {
        ...tx,
        gasLimit,
        maxFeePerGas: maxFee!,
        maxPriorityFeePerGas: maxPriority!,
        type: 2,
      };
    }
  }

  /** ✅ 原生币转出（ETH/BNB/MATIC 等） */
  async sendNative(to: string, amount: string) {
    return this.sendTx({ to, value: ethers.parseEther(amount) });
  }

  /** 查询 ERC20 Token 余额 */
  async getTokenBalance(token: string, user: string) {
    const contract = new Contract(token, ERC20_ABI, this.provider);
    return contract.balanceOf(user);
  }

  /** ERC20 转账 */
  async transferToken(token: string, to: string, amount: string) {
    const c = new Contract(token, ERC20_ABI, this.signer);
    const dec = await c.decimals();
    const amt = ethers.parseUnits(amount, dec);
    const tx = await c.transfer.populateTransaction(to, amt);
    return this.sendTx(tx);
  }

  /** 授权 Token */
  async approveToken(token: string, spender: string, amount: string) {
    const c = new Contract(token, ERC20_ABI, this.signer);
    const dec = await c.decimals();
    const amt = ethers.parseUnits(amount, dec);
    const tx = await c.approve.populateTransaction(spender, amt);
    return this.sendTx(tx);
  }

  /** EIP-2612 Permit 授权 */
  async permitToken(
    token: string,
    spender: string,
    value: string,
    deadline: number,
  ) {
    const owner = this.signer.address;
    const c = new Contract(token, ERC20_ABI, this.provider);
    const nonce = await c.nonces(owner);
    const dec = await c.decimals();
    const amt = ethers.parseUnits(value, dec);
    const domain = {
      name: await c.name(),
      version: "1",
      chainId: await this.provider.getNetwork().then((n) => n.chainId),
      verifyingContract: token,
    };
    const types = {
      Permit: [
        { name: "owner", type: "address" },
        { name: "spender", type: "address" },
        { name: "value", type: "uint256" },
        { name: "nonce", type: "uint256" },
        { name: "deadline", type: "uint256" },
      ],
    };
    const message = { owner, spender, value: amt, nonce, deadline };
    const sig = await this.signer.signTypedData(domain, types, message);
    const { v, r, s } = ethers.Signature.from(sig);
    const tx = await new Contract(
      token,
      ERC20_ABI,
      this.signer,
    ).permit.populateTransaction(owner, spender, amt, deadline, v, r, s);
    return this.sendTx(tx);
  }

  /** 使用 ABI 调用合约（含写操作） */
  async callWithAbi(
    address: string,
    abi: any[],
    method: string,
    args: any[],
    value?: bigint,
  ) {
    const c = new Contract(address, abi, this.signer);
    const tx = await c[method].populateTransaction(...args);
    if (value) {
      tx.value = value;
    }
    return await this.sendTx(tx);
  }

  /** 使用底层接口调用（不依赖 ABI 实例） */
  async callRaw(
    address: string,
    abi: any[],
    method: string,
    args: any[],
    value: bigint = 0n,
  ) {
    const iface = new Interface(abi);
    const data = iface.encodeFunctionData(method, args);
    return this.sendTx({ to: address, data, value });
  }

  /** 监听 Transfer 事件（ERC20） */
  async onTransfer(
    token: string,
    callback: (from: string, to: string, value: bigint) => void,
  ) {
    const c = new Contract(token, ERC20_ABI, this.provider);
    c.on("Transfer", (from, to, value) => callback(from, to, value));
  }

  /** 移除监听 */
  removeAllListeners(token: string) {
    const c = new Contract(token, ERC20_ABI, this.provider);
    c.removeAllListeners();
  }

  /** 批量发送交易（串行 + 间隔控制） */
  async batchSend(txs: TransactionRequest[], delayMs = 1000) {
    const results = [];
    for (const tx of txs) {
      const res = await this.sendTx(tx);
      results.push(res);
      await new Promise((r) => setTimeout(r, delayMs));
    }
    return results;
  }

  /** 🧠 生成助记词 */
  static generateMnemonic(): string {
    return ethers.Wallet.createRandom().mnemonic.phrase;
  }

  /** 从助记词派生地址 */
  static deriveFromMnemonic(mnemonic: string, index = 0): string {
    return ethers.HDNodeWallet.fromPhrase(mnemonic).derivePath(
      `m/44'/60'/0'/0/${index}`,
    ).address;
  }

  /** 查询 NFT 所属地址 */
  async getNftOwner(nft: string, tokenId: string | number) {
    const c = new Contract(nft, ERC721_ABI, this.provider);
    return c.ownerOf(tokenId);
  }

  /** ERC721 转账 */
  async transferNft(nft: string, to: string, tokenId: string | number) {
    const c = new Contract(nft, ERC721_ABI, this.signer);
    const from = this.getAddress();
    const tx = await c.safeTransferFrom.populateTransaction(from, to, tokenId);
    return this.sendTx(tx);
  }

  async getBalance(address: string, format = true) {
    const amt = await this.provider.getBalance(address);
    return format ? ethers.formatEther(amt) : amt;
  }
}
