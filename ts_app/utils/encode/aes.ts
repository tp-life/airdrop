import * as crypto from 'crypto';

export class AesHelper {
  private key: Buffer;

  constructor(key?: string | Buffer) {
    // 默认密钥，如果未提供则使用默认
    if (!key) {
      key = 'ATOa4iA9Bv7jVdQis9#gnaWoaL&YuGae'; // 32 字节
    }
    this.key = typeof key === 'string' ? Buffer.from(key, 'utf-8') : key;
  }

  decrypt(data: Buffer): Buffer {
    const iv = this.key.slice(0, 16); // 使用 key 的前 16 字节作为 IV
    const decipher = crypto.createDecipheriv('aes-256-cbc', this.key, iv);
    decipher.setAutoPadding(false); // 手动处理 padding

    let decrypted = Buffer.concat([decipher.update(data), decipher.final()]);

    // 移除 PKCS#7 padding
    const padLength = decrypted[decrypted.length - 1];
    return decrypted.slice(0, decrypted.length - padLength);
  }

  decryptAndBase64(data: string): Buffer {
    const decoded = Buffer.from(data, 'base64');
    return this.decrypt(decoded);
  }
}
