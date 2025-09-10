import {
  Connection,
  PublicKey,
  Keypair,
  VersionedTransaction,
  TransactionMessage,
  SystemProgram,
  LAMPORTS_PER_SOL,
  TransactionInstruction,
  TransactionExpiredBlockheightExceededError,
  AddressLookupTableAccount,
  ComputeBudgetProgram,
} from "@solana/web3.js";
import {
  getAssociatedTokenAddressSync,
  createAssociatedTokenAccountInstruction,
  createTransferInstruction,
  createCloseAccountInstruction,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  createMintToInstruction,
} from "@solana/spl-token";
import bs58 from "bs58";
import { derivePath } from "ed25519-hd-key";
import bip39 from "bip39";
import { SOL_RPC } from "../../config/rpc";
import logger from "../../infrastructure/logger";

/**
 * 简化返回类型：关闭账户操作的结果
 * tx: 成功发送的交易签名数组
 * hasAccount: 是否存在任何 token 账户
 * err: 出错信息（如果有）
 */
export interface CloseAccount {
  tx?: string[];
  hasAccount?: boolean;
  err?: string;
}

/**
 * SOL 转账返回结果
 * signature：交易签名（成功时）
 * err：错误信息（失败时）
 */
export interface TransferSOLResult {
  signature?: string;
  err?: string;
}

/**
 * Token 账户信息（本类内部使用的简化类型）
 * amount 使用 bigint 表示最小单位（避免浮点误差）
 * uiAmount：供展示使用的浮点数 （可能为 null 时处理为 0）
 */
export interface TokenAccountInfo {
  pubkey: PublicKey;
  mint: PublicKey;
  amount: bigint;
  uiAmount: number;
}

// 黑洞地址（用于将 token 转入不可达地址以销毁）
// 注意：把代币发送到此地址会导致不可恢复地丢失代币
const INCINERATOR = new PublicKey(
  "1nc1nerator11111111111111111111111111111111",
);

// 一个可注入的轻量日志接口，方便测试或生产环境替换
type Logger = {
  info: (...a: any[]) => void;
  warn: (...a: any[]) => void;
  error: (...a: any[]) => void;
};
const NoopLogger: Logger = logger;

/**
 * Solana 工具类（优化版）
 *
 * 功能：
 * - 查询 SOL 余额
 * - 转账单笔 SOL / 清仓（尽量转出所有可用 SOL，保留手续费与可配置保留量）
 * - 查询 token 账户并批量把 token 转到黑洞地址，同时关闭空账户
 *
 * 设计要点：
 * - 使用 bigint 表示 lamports（避免浮点精度问题）
 * - 发送 v0 交易（TransactionMessage + VersionedTransaction）
 * - 估算手续费（getFeeForMessage）以便准确计算可发送数量
 * - 批量合并指令并分包发送（避免单笔交易过大）
 */
export class Solana {
  private connection: Connection;
  private gasWallet: Keypair; // 用于付手续费/创建 ATA 的钱包（通常是你控制的 payer）
  private log: Logger;

  /**
   * @param payerPK - 用于支付 gas 的钱包的 base58 秘钥（secretKey base58）
   * @param rpc - RPC 地址（默认使用配置中的 SOL_RPC）
   * @param logger - 可选的日志对象（必须包含 info/warn/error）
   */
  constructor(
    payerPK: string,
    rpc: string = SOL_RPC,
    logger: Logger = NoopLogger,
  ) {
    // 初始化连接（使用 confirmed 作为默认提交等级）
    this.connection = new Connection(rpc, {
      commitment: "confirmed",
      httpHeaders: { "Content-Type": "application/json" },
    });

    // 从 base58 秘钥构建 Keypair，作为 gas 支付钱包
    this.gasWallet = Keypair.fromSecretKey(bs58.decode(payerPK));
    this.log = logger;
    this.log.info("Gas 支付钱包:", this.gasWallet.publicKey.toBase58());
  }

  // -------------------------
  // 辅助工具函数（金额转换等）
  // -------------------------

  /**
   * 把以 SOL 为单位的浮点数转换成 lamports（bigint）
   * 注意：这里用了 Math.floor 将小数向下取整为最接近的 lamport
   * @param sol
   */
  private solToLamports(sol: number): bigint {
    return BigInt(Math.floor(sol * LAMPORTS_PER_SOL));
  }

  /**
   * 把 lamports（bigint）转换成 SOL（number），供展示使用
   * @param lamports
   */
  private lamportsToSol(lamports: bigint): number {
    return Number(lamports) / LAMPORTS_PER_SOL;
  }

  // -------------------------
  // 构造并发送 V0 交易（集中处理）
  // -------------------------

  /**
   * 构建并发送一笔 v0 交易（支持可选的 AddressLookupTableAccounts）
   * 该函数负责：
   *  - 获取最新 blockhash
   *  - 使用 TransactionMessage.compileToV0Message 构建 v0 消息
   *  - 通过 getFeeForMessage 估算手续费并打印（便于 debug）
   *  - 对 tx 签名并调用 connection.sendTransaction 发送
   *  - 等待确认（confirmTransaction）
   *
   * 注意：sendTransaction/confirmTransaction 期间可能抛出 TransactionExpiredBlockheightExceededError，
   * 调用方可据此判断交易是否已上链或过期。
   *
   * @param payer - 交易费用由哪个 Keypair 作为 payer（通常是 gasWallet）
   * @param signers - 需要对交易签名的 Keypair 列表（通常包含 payer 与相关 owner）
   * @param instructions - 要打包的指令数组
   * @param altAccounts - 可选的 address lookup table 列表（若不使用可忽略）
   */
  private async buildAndSendV0Tx(
    payer: Keypair,
    signers: Keypair[],
    instructions: TransactionInstruction[],
    altAccounts: AddressLookupTableAccount[] = [],
    fee?: number, // 可选优先费
  ): Promise<string> {
    // 1. 获取最新的 blockhash 与 lastValidBlockHeight（用于交易过期检查）
    const { blockhash, lastValidBlockHeight } =
      await this.connection.getLatestBlockhash("confirmed");

    // 如果传入 fee，则添加 ComputeBudget 指令
    if (fee && fee > 0) {
      const computeIx = ComputeBudgetProgram.setComputeUnitPrice({
        microLamports: fee,
      });
      instructions.unshift(computeIx);
    }

    // 2. 构造 v0 message（如果有 altAccounts，则传入以支持 address lookup table）
    const msg = new TransactionMessage({
      payerKey: payer.publicKey,
      recentBlockhash: blockhash,
      instructions,
    }).compileToV0Message(altAccounts);

    // // 3. 估算手续费（返回的 value 可能为 null，需要处理）
    // const fee = await this.connection.getFeeForMessage(msg, "confirmed");
    // this.log.info("预估手续费 lamports:", fee.value ?? 0);

    // 4. 创建 VersionedTransaction 并对其签名
    const tx = new VersionedTransaction(msg);
    tx.sign(signers);

    // 5. 发送交易
    let signature: string;
    try {
      signature = await this.connection.sendTransaction(tx, {
        maxRetries: 4,
        skipPreflight: false,
        preflightCommitment: "confirmed",
      });
    } catch (e: any) {
      // 常见场景：blockheight 超时错误会抛出 TransactionExpiredBlockheightExceededError
      if (e instanceof TransactionExpiredBlockheightExceededError) {
        // 返回空字符串或 e.signature 以便调用方进一步处理
        return e.signature ?? "";
      }
      // 其他错误继续抛出
      throw e;
    }

    // 6. 确认交易是否成功（confirmed）
    const conf = await this.connection.confirmTransaction(
      { signature, blockhash, lastValidBlockHeight },
      "confirmed",
    );
    if (conf.value.err) {
      this.log.error("交易确认失败:", conf.value.err);
    }
    return signature;
  }

  // -------------------------
  // 助记词 -> Keypair（派生）
  // -------------------------
  /**
   * 从助记词派生出对应的 Keypair（使用常见的 solana 派生路径）
   * @param mnemonic - 助记词字符串
   */
  private async getKeypairFromMnemonic(mnemonic: string): Promise<Keypair> {
    // bip39.mnemonicToSeed 返回 Buffer（seed）
    const seed = await bip39.mnemonicToSeed(mnemonic);
    // 这里使用 m/44'/501'/0'/0'（solana 推荐的 bip44 路径）
    const { key } = derivePath("m/44'/501'/0'/0'", seed.toString("hex"));
    return Keypair.fromSeed(key);
  }

  // -------------------------
  // 余额查询
  // -------------------------

  /**
   * 获取某个公钥的 SOL 余额（单位为 SOL，使用 confirmed 提交等级）
   */
  async getSOLBalance(pubkey: PublicKey): Promise<number> {
    const lamports = await this.connection.getBalance(pubkey, "confirmed");
    return this.lamportsToSol(BigInt(lamports));
  }

  /**
   * 通过地址字符串查询 SOL 余额（简单封装）
   */
  async getSOLBalanceByAddress(address: string): Promise<number> {
    return this.getSOLBalance(new PublicKey(address));
  }

  // -------------------------
  // 转 SOL（单笔）
  // -------------------------

  /**
   * 从一个 Keypair 向指定地址转移指定数量的 SOL
   *
   * 关键步骤：
   *  - 验证目标地址
   *  - 把 SOL -> lamports（bigint）
   *  - 构建 transfer 指令并通过 buildAndSendV0Tx 发送
   *  - 在发送前通过 getFeeForMessage 估算手续费并检查余额是否充足
   *
   * @param from - 发送方 Keypair（必须有私钥，用于签名）
   * @param to - 目标地址字符串
   * @param amountSol - 要发送的 SOL 数量（单位 SOL）
   */
  async transferSOL(
    from: Keypair,
    to: string,
    amountSol: number,
  ): Promise<TransferSOLResult> {
    if (!from || !from.secretKey.length) {
      from = this.gasWallet;
    }
    try {
      // 1) 验证目标地址
      const toPk = new PublicKey(to);

      // 2) 把要发送的 SOL 转为 lamports（bigint）
      const lamports = this.solToLamports(amountSol);

      // 3) 准备一个临时 blockhash 用于构建 message（仅用于估费）
      const { blockhash } =
        await this.connection.getLatestBlockhash("confirmed");

      // 4) 单条 transfer 指令（注意 SystemProgram.transfer 的 lamports 参数通常为 number）
      const ix = SystemProgram.transfer({
        fromPubkey: from.publicKey,
        toPubkey: toPk,
        lamports: Number(lamports),
      });

      // 5) 用该指令构建 message 并调用 getFeeForMessage 去估算手续费
      const msg = new TransactionMessage({
        payerKey: from.publicKey,
        recentBlockhash: blockhash,
        instructions: [ix],
      }).compileToV0Message();

      const feeLamports = BigInt(
        (await this.connection.getFeeForMessage(msg, "confirmed")).value ?? 0,
      );
      // 当前账户的实际 lamports
      const curLamports = BigInt(
        await this.connection.getBalance(from.publicKey, "confirmed"),
      );

      // 6) 检查余额是否足够（发送金额 + 手续费）
      if (curLamports < lamports + feeLamports) {
        const curSol = this.lamportsToSol(curLamports);
        return {
          err: `余额不足，当前 ${curSol} SOL，需要 ${amountSol} SOL + 手续费`,
        };
      }

      // 7) 构建并发送交易（由发送方签名）
      const sig = await this.buildAndSendV0Tx(from, [from], [ix]);
      this.log.info(`成功转移 ${amountSol} SOL 到 ${to}，签名: ${sig}`);
      return { signature: sig };
    } catch (e: any) {
      // 处理过期错误等
      if (e instanceof TransactionExpiredBlockheightExceededError) {
        return { err: `交易过期（可能已上链）`, signature: e.signature };
      }
      return { err: `转移失败: ${e?.message ?? e}` };
    }
  }

  // -------------------------
  // 将账户几乎清空（尽量转出除手续费与保留金额外的剩余 SOL）
  // -------------------------

  /**
   * 把账户内尽可能多的 SOL 转到目标地址，保留 minReserveSol 作为保留量（避免账户完全耗尽）
   *
   * 实现思路：
   *  - 先用一个 probe transaction 的 message 估算手续费（使用占位 1 lamport transfer）
   *  - 计算可发送 lamports = curLamports - fee - reserve
   *  - 构建 transfer 指令发送
   *
   * @param from - 源 Keypair（需要私钥）
   * @param to - 目标地址字符串
   * @param minReserveSol - 保留的 SOL 数量（默认 0）
   */
  async transferAllSOL(
    from: Keypair,
    to: string,
    minReserveSol = 0,
  ): Promise<TransferSOLResult> {
    if (!from || !from.secretKey.length) {
      from = this.gasWallet;
    }
    try {
      const toPk = new PublicKey(to);
      const curLamports = BigInt(
        await this.connection.getBalance(from.publicKey, "confirmed"),
      );
      const reserve = this.solToLamports(minReserveSol);

      // 1) probe 用来估算手续费
      const { blockhash } =
        await this.connection.getLatestBlockhash("confirmed");
      const probeIx = SystemProgram.transfer({
        fromPubkey: from.publicKey,
        toPubkey: toPk,
        lamports: 1, // 占位 1 lamport
      });
      const probeMsg = new TransactionMessage({
        payerKey: from.publicKey,
        recentBlockhash: blockhash,
        instructions: [probeIx],
      }).compileToV0Message();
      const fee = BigInt(
        (await this.connection.getFeeForMessage(probeMsg, "confirmed")).value ??
          0,
      );

      // 2) 判断是否足够支付手续费 + reserve
      if (curLamports <= fee + reserve) {
        const curSol = this.lamportsToSol(curLamports);
        return {
          err: `余额不足以覆盖手续费与保留金。当前 ${curSol} SOL，需要至少手续费+保留 ${minReserveSol} SOL`,
        };
      }

      // 3) 计算要发送的 lamports（扣除手续费与保留）
      const sendLamports = curLamports - fee - reserve;
      const ix = SystemProgram.transfer({
        fromPubkey: from.publicKey,
        toPubkey: toPk,
        lamports: Number(sendLamports),
      });

      // 4) 发送交易（由 from 签名）
      const sig = await this.buildAndSendV0Tx(from, [from], [ix]);
      this.log.info(
        `清仓转出 ${this.lamportsToSol(sendLamports)} SOL 到 ${to}，签名: ${sig}`,
      );
      return { signature: sig };
    } catch (e: any) {
      return { err: `转移所有 SOL 失败: ${e?.message ?? e}` };
    }
  }

  // -------------------------
  // Token 账户查询（SPL Token）
  // -------------------------

  /**
   * 获取某个 owner 下的 parsed token accounts（原生 RPC 调用）
   * 返回值与 RPC 的 getParsedTokenAccountsByOwner 相同格式（value 数组）
   */
  async getTokenAccountsByOwner(owner: PublicKey) {
    const res = await this.connection.getParsedTokenAccountsByOwner(owner, {
      programId: TOKEN_PROGRAM_ID,
    });
    return res.value;
  }

  /**
   * 把 getTokenAccountsByOwner 的返回做成更友好的 TokenAccountInfo 列表
   * 把 amount 转成 bigint，uiAmount 作为展示数值
   */
  async getTokenAccountsInfo(owner: PublicKey): Promise<TokenAccountInfo[]> {
    const accs = await this.getTokenAccountsByOwner(owner);
    return accs.map(({ pubkey, account }) => {
      const info = (account.data as any).parsed.info;
      const amountStr = info.tokenAmount.amount as string;
      const ui = info.tokenAmount.uiAmount as number | null;
      return {
        pubkey,
        mint: new PublicKey(info.mint),
        amount: BigInt(amountStr),
        uiAmount: ui ?? 0,
      };
    });
  }

  /**
   * 获取账户总览（sol balance + token accounts summary）
   * 返回示例：
   * { solBalance, tokenAccounts, totalTokenValue, totalAssets, accountCount }
   */
  async getAccountOverview(pk: PublicKey) {
    const sol = await this.getSOLBalance(pk);
    const tokens = await this.getTokenAccountsInfo(pk);
    const totalTokenUI = tokens.reduce((s, t) => s + (t.uiAmount || 0), 0);
    return {
      solBalance: sol,
      tokenAccounts: tokens,
      totalTokenValue: totalTokenUI,
      totalAssets: sol + totalTokenUI,
      accountCount: tokens.length,
    };
  }

  // -------------------------
  // 批量处理辅助（把多个 instruction 分包）
  // -------------------------

  /**
   * 把数组按固定大小 chunk 分割，返回二维数组（用于分包发送指令）
   */
  private chunk<T>(arr: T[], size: number): T[][] {
    const out: T[][] = [];
    for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
    return out;
  }

  // -------------------------
  // 构建 Token 转移相关指令（create ATA if needed + transfer）
  // -------------------------

  /**
   * 构建：若目标 ATA 不存在则创建 + 从原 tokenAccount 转到目标 ATA 的一组指令
   *
   * 说明：
   * - payer：用于支付创建目标 ATA 的费用（通常为 this.gasWallet）
   * - ownerToReceive：黑洞地址（或任何目标地址）作为 ATA 的 owner
   * - fromTokenAcc：原 token account 的 pubkey（直接使用 RPC 返回的 pubkey）
   * - ownerOfFromTokenAcc：原 token account 的 owner（通常是 token 所属者/钱包）
   *
   * 返回值是一个 instruction[]（可能包含 createAssociatedTokenAccountInstruction 和 transfer instruction）
   *
   * 注意：
   * - createAssociatedTokenAccountInstruction 在一些实现中如果 ATA 已存在可能会导致重复失败，
   *   你可以改为在发送前检查 ATA 是否存在并只在不存在时加入创建指令；这里为了合并交易直接加入创建指令以提高合并率。
   */
  private buildTransferAndMaybeCreateATA(
    payer: PublicKey,
    ownerToReceive: PublicKey,
    mint: PublicKey,
    fromTokenAcc: PublicKey,
    ownerOfFromTokenAcc: PublicKey,
    amount: bigint,
  ): TransactionInstruction[] {
    // 目标 ATA（同步版本，避免异步调用）
    const ata = getAssociatedTokenAddressSync(
      mint,
      ownerToReceive,
      true,
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID,
    );
    const ixs: TransactionInstruction[] = [];

    // 1) 把目标 ATA 的创建指令放入（由 payer 付费）
    //    如果 ATA 已存在，该指令可能会让交易失败（取决于 RPC 的容错），如需更强鲁棒性可先单独 RPC 检测后再决定是否加入。
    ixs.push(
      createAssociatedTokenAccountInstruction(
        payer, // 付费者（gas 钱包）
        ata, // ATA 地址（将被创建或已存在）
        ownerToReceive, // ATA 所有者（黑洞地址）
        mint,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID,
      ),
    );

    // 2) 从原 token account 转到黑洞的 ATA
    ixs.push(
      createTransferInstruction(
        fromTokenAcc,
        ata,
        ownerOfFromTokenAcc,
        amount,
        [], // 额外签名者，一般为空
        TOKEN_PROGRAM_ID,
      ),
    );

    return ixs;
  }

  /**
   * 创建一个 close account 指令：把 token account 关闭并把租金退回到 destination
   */
  private buildCloseIx(
    tokenAccount: PublicKey,
    destination: PublicKey,
    ownerOfTokenAccount: PublicKey,
  ): TransactionInstruction {
    return createCloseAccountInstruction(
      tokenAccount,
      destination,
      ownerOfTokenAccount,
      [],
      TOKEN_PROGRAM_ID,
    );
  }

  // -------------------------
  // 批量处理 token accounts（核心逻辑）
  // -------------------------

  /**
   * 对一批 token accounts 执行：
   *  - 有余额的转到黑洞（并在同一笔交易中尝试创建黑洞 ATA）
   *  - 空账户直接发送 close 指令关闭
   *
   * 处理策略：
   *  - 先把所有需要 transfer 的账户转换成若干 instruction（每个转账可能包含两个指令：create ATA + transfer）
   *  - 将指令按 batchSize 分包并依次发送（每包调用 buildAndSendV0Tx）
   *  - 然后对已知空账户构建 close 指令并分包发送
   *
   * @param tokenAccounts - getParsedTokenAccountsByOwner 返回的数组（value）
   * @param targetWallet - 该账户的 Keypair（用于在必要时签名关闭等）
   * @param rentRefundTo - 关闭后租金退回到哪个地址（通常是 gasWallet 或用户指定地址）
   * @param batchSize - 每笔交易合并的最大指令条数（用于控制交易大小）
   */
  private async processTokenAccountsBatch(
    tokenAccounts: Awaited<ReturnType<Solana["getTokenAccountsByOwner"]>>,
    targetWallet: Keypair,
    rentRefundTo: PublicKey,
    batchSize: number,
  ): Promise<string[]> {
    const sigs: string[] = [];
    if (tokenAccounts.length === 0) return sigs;

    // 把账户分成有余额与空余额两类
    const withBal: { from: PublicKey; mint: PublicKey; amount: bigint }[] = [];
    const empty: PublicKey[] = [];

    for (const { pubkey, account } of tokenAccounts) {
      const info = (account.data as any).parsed.info;
      const amount = BigInt(info.tokenAmount.amount as string);
      const mint = new PublicKey(info.mint as string);
      if (amount > 0n) withBal.push({ from: pubkey, mint, amount });
      else empty.push(pubkey);
    }

    // 1) 构建所有 transfer 相关的 instruction（create ATA + transfer）
    const transferIxs: TransactionInstruction[] = [];
    for (const item of withBal) {
      transferIxs.push(
        ...this.buildTransferAndMaybeCreateATA(
          this.gasWallet.publicKey, // payer：gas 钱包付费创建 ATA
          INCINERATOR, // blackhole
          item.mint,
          item.from,
          targetWallet.publicKey, // 假设 targetWallet 是原 tokenAccount 的 owner（若不是，会在 transfer 时失败）
          item.amount,
        ),
      );
    }

    // 分包发送 transfer 指令（每包大小由 batchSize 控制）
    if (transferIxs.length > 0) {
      for (const pack of this.chunk(transferIxs, batchSize)) {
        // 由 gasWallet 与 targetWallet 对交易签名（若需要 targetWallet 签名，传入它）
        const sig = await this.buildAndSendV0Tx(
          this.gasWallet,
          [this.gasWallet, targetWallet],
          pack,
        );
        sigs.push(sig);
      }
    }

    // 2) 构建并发送关闭空账户的指令
    const closeIxs = empty.map((acc) =>
      this.buildCloseIx(acc, rentRefundTo, targetWallet.publicKey),
    );
    if (closeIxs.length > 0) {
      for (const pack of this.chunk(closeIxs, batchSize)) {
        const sig = await this.buildAndSendV0Tx(
          this.gasWallet,
          [this.gasWallet, targetWallet],
          pack,
        );
        sigs.push(sig);
      }
    }

    return sigs;
  }

  // -------------------------
  // 对外 API：关闭空 SPL Token 账户（批量优化版）
  // -------------------------

  /**
   * 入口函数：关闭目标账户下的空 token 账户，并把有余额的 token 转到黑洞（随后关闭）
   *
   * 参数：
   * - closeAccountPk: 目标账户的 secretKeyBase58（二选一）
   * - closeAccountWord: 目标账户的助记词（二选一）
   * - toAddr: 租金回退地址（默认 gasWallet）
   * - batchSize: 每笔交易合并的最大 instruction 数量（数值越大合并越多，但越可能达到交易大小限制）
   *
   * 返回：
   * - { hasAccount: boolean, tx?: string[], err?: string }
   *
   * 注意：
   * - 部分 token 可能不可转（frozen、需要授权等），此时 transfer 会失败并抛出错误。
   * - createAssociatedTokenAccountInstruction 如果尝试创建已存在的 ATA 可能导致交易失败（可做前置检测来避免）。
   */
  async closeEmptySPLTokenAccounts(
    closeAccountPk: string = "",
    closeAccountWord: string = "",
    toAddr: string = this.gasWallet.publicKey.toBase58(),
    batchSize: number = 50,
  ): Promise<CloseAccount> {
    try {
      // 1) 从传入参数构建 targetWallet
      let targetWallet: Keypair;
      if (closeAccountWord)
        targetWallet = await this.getKeypairFromMnemonic(closeAccountWord);
      else if (closeAccountPk)
        targetWallet = Keypair.fromSecretKey(bs58.decode(closeAccountPk));
      else return { err: "未提供待处理账户的私钥或助记词" };

      const owner = targetWallet.publicKey;
      this.log.info("开始处理账户:", owner.toBase58());

      // 2) 获取该账户下的 parsed token accounts
      const tokenAccounts = await this.getTokenAccountsByOwner(owner);
      if (tokenAccounts.length === 0) {
        this.log.info("没有任何 SPL Token 账户。");
        return { hasAccount: false };
      }

      // 3) 处理一轮（把有余额的转到黑洞并关闭已空账户）
      const signatures = await this.processTokenAccountsBatch(
        tokenAccounts,
        targetWallet,
        new PublicKey(toAddr), // 租金返还地址
        batchSize,
      );

      // 4) 可选：再扫描一遍，关闭那些转移后变空的账户（提升彻底性）
      const leftover = await this.getTokenAccountsByOwner(owner);
      const maybeEmpty: PublicKey[] = [];
      for (const { pubkey, account } of leftover) {
        const info = (account.data as any).parsed.info;
        const amount = BigInt(info.tokenAmount.amount as string);
        if (amount === 0n) maybeEmpty.push(pubkey);
      }
      if (maybeEmpty.length > 0) {
        for (const pack of this.chunk(
          maybeEmpty.map((acc) =>
            this.buildCloseIx(acc, new PublicKey(toAddr), owner),
          ),
          batchSize,
        )) {
          const sig = await this.buildAndSendV0Tx(
            this.gasWallet,
            [this.gasWallet, targetWallet],
            pack,
          );
          signatures.push(sig);
        }
      }

      return { hasAccount: true, tx: signatures };
    } catch (e: any) {
      this.log.error("关闭 SPL Token 账户失败:", e);
      return { err: e?.message ?? String(e) };
    }
  }

  /**
   * 转移 SPL Token
   * @param from - 发送方钱包 Keypair（必须有代币账户）
   * @param toAddr - 接收方钱包地址
   * @param mintAddr - Token mint 地址
   * @param amount - 转移数量（注意：这里是最小单位，例如 USDC 有 6 位小数，要传 1000000 代表 1 USDC）
   */
  async transferSPLToken(
    from: Keypair,
    toAddr: string,
    mintAddr: string,
    amount: bigint,
  ): Promise<{ signature?: string; err?: string }> {
    try {
      const mint = new PublicKey(mintAddr);
      const to = new PublicKey(toAddr);

      // 获取发送方和接收方的 ATA
      const fromATA = await getAssociatedTokenAddress(mint, from.publicKey);
      const toATA = await getAssociatedTokenAddress(mint, to);

      // 构造转账指令
      const ix = createTransferInstruction(
        fromATA,
        toATA,
        from.publicKey,
        amount,
        [],
        TOKEN_PROGRAM_ID,
      );

      const sig = await this.buildAndSendV0Tx(from, [from], [ix]);
      this.log.info(
        `成功转移 ${amount.toString()} 个 Token(${mintAddr}) 到 ${toAddr}，签名: ${sig}`,
      );
      return { signature: sig };
    } catch (e: any) {
      return { err: `转移 SPL Token 失败: ${e?.message ?? e}` };
    }
  }

  // -------------------------
  // 铸造 SPL Token
  // -------------------------

  /**
   * 铸造 SPL Token 到指定账户
   * @param mintAuthority - 拥有 mint 权限的钱包
   * @param destAddr - 接收 Token 的用户地址
   * @param mintAddr - Token mint 地址
   * @param amount - 铸造数量（最小单位）
   */
  async mintSPLToken(
    mintAuthority: Keypair,
    destAddr: string,
    mintAddr: string,
    amount: bigint,
  ): Promise<{ signature?: string; err?: string }> {
    try {
      const mint = new PublicKey(mintAddr);
      const dest = new PublicKey(destAddr);

      // 获取接收者 ATA（不存在时会报错，可在外部提前创建）
      const destATA = await getAssociatedTokenAddress(mint, dest);

      // 构造 mint 指令
      const ix = createMintToInstruction(
        mint,
        destATA,
        mintAuthority.publicKey,
        amount,
        [],
        TOKEN_PROGRAM_ID,
      );

      const sig = await this.buildAndSendV0Tx(
        mintAuthority,
        [mintAuthority],
        [ix],
      );
      this.log.info(
        `成功铸造 ${amount.toString()} 个 Token(${mintAddr}) 到 ${destAddr}，签名: ${sig}`,
      );
      return { signature: sig };
    } catch (e: any) {
      return { err: `铸造 SPL Token 失败: ${e?.message ?? e}` };
    }
  }
}
