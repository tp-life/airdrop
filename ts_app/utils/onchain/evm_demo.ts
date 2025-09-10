import { ethers } from "ethers";
import { EvmWallet } from "./evm";

async function demo() {
  // 请替换为你的私钥，千万不要泄露私钥
  const PRIVATE_KEY = "你的私钥";
  if (!PRIVATE_KEY) {
    throw new Error("请先在代码中填写你的私钥");
  }

  // 初始化钱包，使用 BSC 主网RPC（或者换成你需要的链）
  const wallet = new EvmWallet("bsc", {
    privateKey: PRIVATE_KEY,
  });

  console.log("钱包地址:", wallet.getAddress());

  try {
    // 1. 发送原生币（BNB）
    const nativeTxReceipt = await wallet.sendNative("0x接收地址", "0.001");
    console.log("原生币转账成功，交易哈希:", nativeTxReceipt.hash);
  } catch (e) {
    console.error("原生币转账失败:", e);
  }

  // 2. 查询 ERC20 代币余额（示例：BSC上的USDT）
  const usdtAddress = "0x55d398326f99059fF775485246999027B3197955";
  try {
    const balance = await wallet.getTokenBalance(
      usdtAddress,
      wallet.getAddress(),
    );
    console.log(`USDT 余额: ${balance.toString()}`);
  } catch (e) {
    console.error("查询 USDT 余额失败:", e);
  }

  try {
    // 3. ERC20 转账 10 USDT
    const erc20TxReceipt = await wallet.transferToken(
      usdtAddress,
      "0x接收地址",
      "10",
    );
    console.log("ERC20 转账成功，交易哈希:", erc20TxReceipt.hash);
  } catch (e) {
    console.error("ERC20 转账失败:", e);
  }

  try {
    // 4. ERC20 授权 approve 100 USDT
    const approveTxReceipt = await wallet.approveToken(
      usdtAddress,
      "0x授权地址",
      "100",
    );
    console.log("ERC20 授权成功，交易哈希:", approveTxReceipt.hash);
  } catch (e) {
    console.error("ERC20 授权失败:", e);
  }

  try {
    // 5. EIP-2612 Permit 授权
    const deadline = Math.floor(Date.now() / 1000) + 3600; // 1小时后过期
    const permitTxReceipt = await wallet.permitToken(
      usdtAddress,
      "0x授权地址",
      "100",
      deadline,
    );
    console.log("Permit 授权成功，交易哈希:", permitTxReceipt.hash);
  } catch (e) {
    console.error("Permit 授权失败:", e);
  }

  // 6. 使用 ABI 调用合约示例（PancakeSwap Router swapExactETHForTokens）
  const pancakeRouterAddress = "0x10ED43C718714eb63d5aA57B78B54704E256024E";
  const pancakeRouterAbi = [
    "function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) payable returns (uint[] memory amounts)",
  ];
  try {
    const amountOutMin = 0; // 实际使用时请设置合理的最小接受数量
    const path = [
      "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE", // BNB伪地址，实际请根据链换成对应地址或WBNB地址
      usdtAddress,
    ];
    const to = wallet.getAddress();
    const deadline = Math.floor(Date.now() / 1000) + 1800; // 30分钟有效期
    const swapTxReceipt = await wallet.callWithAbi(
      pancakeRouterAddress,
      pancakeRouterAbi,
      "swapExactETHForTokens",
      [amountOutMin, path, to, deadline],
    );
    console.log(
      "swapExactETHForTokens 调用成功，交易哈希:",
      swapTxReceipt.hash,
    );
  } catch (e) {
    console.error("swapExactETHForTokens 调用失败:", e);
  }

  // 7. 使用底层 raw 调用 ERC20 transfer 函数
  // const rawIface = [
  //   "function transfer(address to, uint256 amount) returns (bool)",
  // ];
  // try {
  //   const to = "0xabcabcabcabcabcabcabcabcabcabcabcabcabc";
  //   // 获取 USDT decimals
  //   const contract = new (wallet as any).provider.getCode()
  //     ? new ethers.Contract(usdtAddress, ERC20_ABI, wallet)
  //     : null;
  //   const decimals = contract ? await contract.decimals() : 18;
  //   const amount = ethers.parseUnits("1", decimals);

  //   // 发送底层调用交易
  //   const rawTxReceipt = await wallet.callRaw(
  //     usdtAddress,
  //     rawIface,
  //     "transfer",
  //     [to, amount],
  //   );
  //   console.log("底层调用 transfer 成功，交易哈希:", rawTxReceipt.hash);
  // } catch (e) {
  //   console.error("底层调用 transfer 失败:", e);
  // }

  // 8. 监听 ERC20 Transfer 事件
  wallet.onTransfer(usdtAddress, (from, to, value) => {
    console.log(
      `Transfer 事件 - 从 ${from} 到 ${to} 数量: ${value.toString()}`,
    );
  });

  // 9. 查询 NFT 所有者
  const nftAddress = "0x1234567890abcdef1234567890abcdef12345678";
  const tokenId = 1;
  try {
    const owner = await wallet.getNftOwner(nftAddress, tokenId);
    console.log(`NFT #${tokenId} 的所有者是: ${owner}`);
  } catch (e) {
    console.error("查询 NFT 所有者失败:", e);
  }

  // 10. ERC721 NFT 转账
  try {
    const erc721TxReceipt = await wallet.transferNft(
      nftAddress,
      "0x接收地址",
      tokenId,
    );
    console.log("ERC721 转账成功，交易哈希:", erc721TxReceipt.hash);
  } catch (e) {
    console.error("ERC721 转账失败:", e);
  }
}

demo().catch(console.error);
