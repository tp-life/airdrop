import { Wallet } from "ethers";
import bs58 from "bs58";
import logger from "../../infrastructure/logger";
import nacl from "tweetnacl";

/**
 * 使用私钥本地签名消息，并确保签名结果带有 0x 前缀
 * @param privateKey 私钥（0x 开头）
 * @param message 要签名的消息字符串
 * @returns 签名结果（带 0x 前缀）
 */
export async function signMessageWithPrivateKey(
  privateKey: string,
  message: string,
): Promise<string> {
  const wallet = new Wallet(privateKey);
  let signature = await wallet.signMessage(message);

  if (!signature.startsWith("0x")) {
    signature = "0x" + signature;
  }

  return signature;
}

export function decimalToBigInt(value: number, decimals = 18): bigint {
  const multiplier = 10 ** decimals;
  return BigInt(Math.floor(value * multiplier));
}

export function signMessageBySol(message: string, secretKey: string): string {
  try {
    const encodedMessage = new TextEncoder().encode(message);
    const decodedSecretKey = bs58.decode(secretKey);
    if (!decodedSecretKey || decodedSecretKey.length !== 64) {
      throw new Error("Invalid private key length");
    }
    const signature = nacl.sign.detached(encodedMessage, decodedSecretKey);

    return bs58.encode(signature);
  } catch (error) {
    logger.error(`Failed to sign message: ${error.message}`);
    throw error;
  }
}
