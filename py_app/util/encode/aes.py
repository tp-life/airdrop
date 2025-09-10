import base64
from Crypto.Cipher import AES
from Crypto.Util.Padding import unpad, pad


class AesHelper:
    def __init__(self, key=None):
        # 默认密钥，如果没有传递则使用该默认密钥
        if key is None:
            key = b'ATOa4iA9Bv7jVdQis9#gnaWoaL&YuGae'  # 默认密钥
        self.key = key

    def decrypt(self, data):
        # 直接使用加密数据，不做截断
        # 创建解密对象，AES.new 会自动处理前 16 字节为 IV
        cipher = AES.new(self.key, AES.MODE_CBC, iv=self.key[:AES.block_size])
        # 解密整个数据
        decrypted = unpad(cipher.decrypt(data[0:]), AES.block_size)
        
        return decrypted

    def decrypt_and_base64(self, data):
        # 解码 Base64 数据并解密
        decoded_data = base64.b64decode(data)
        return self.decrypt(decoded_data)


def encrypt_to_base64(plaintext: str, secret_key: str) -> str:
    key_bytes = secret_key.encode("utf-8")
    plaintext_bytes = plaintext.encode("utf-8")
    padded_data = pad(plaintext_bytes, AES.block_size)
    cipher = AES.new(key_bytes, AES.MODE_ECB)
    ciphertext = cipher.encrypt(padded_data)
    return base64.b64encode(ciphertext).decode("utf-8")
