from Crypto.Cipher import AES
import base64


class AECBCipher:
    """
    # 初始化 (使用 32 字节密钥)
    key = b"JoDtyuW7]3oj2(wQ+@$_,j8dlh\"1>3<="
    cipher = AECBCipher(key)

    # 加密示例
    plaintext = '{"chainId":1,"address":"0xA6ef0D999A75312F29C3b86dc03DF9a31716fFA8","gbInviteCode":"GBD9NKK5","random":"1748486442409D2iNkd"}'
    encrypted = cipher.encrypt(plaintext)
    print("加密后密文 (Base64):", encrypted)

    # 解密示例
    decrypted = cipher.decrypt(encrypted)
    print("解密结果:", decrypted)

    # 解密外部传入的密文
    external_ciphertext = "pTQG37RvwzdYbOoEldBR7A7FVUwiU2wUn8m+sYKT/Nqdw6fnU6cWOXGd7CVCwmceVJIQXJ6/Ym+hQsIRuYXF9dTIlR5exCuuo1RC0/53Yp5jy9KN8dUho8xGLphhZcZrojsjRS+p368lgq32foZttcXBU/2hWO7O2hpB3O5+VW0="
    print("解密外部密文:", cipher.decrypt(external_ciphertext))

    output:
    加密后密文 (Base64): pTQG37RvwzdYbOoEldBR7A7FVUwiU2wUn8m+sYKT/Nqdw6fnU6cWOXGd7CVCwmceVJIQXJ6/Ym+hQsIRuYXF9dTIlR5exCuuo1RC0/53Yp5jy9KN8dUho8xGLphhZcZr47vc5N7TI+l5GtKXmCEj/0+L1F8pWy2kNaufOGUh4zI=
    解密结果: {"chainId":1,"address":"0xA6ef0D999A75312F29C3b86dc03DF9a31716fFA8","gbInviteCode":"GBD9NKK5","random":"1748486442409D2iNkd"}
    解密外部密文: {"chainId":1,"address":"0xA6ef0D999A75312F29C3b86dc03DF9a31716fFA8","gbInviteCode":"GBD9NKK5","random":"1748421984221C6iNkd"}

    """

    def __init__(self, key: bytes):
        """
        初始化 AES 加密/解密器

        :param key: 加密密钥 (16/24/32 字节对应 AES-128/AES-192/AES-256)
        """
        if len(key) not in (16, 24, 32):
            raise ValueError("Key must be 16, 24, or 32 bytes long")
        self.key = key

    @staticmethod
    def pkcs7_pad(data: bytes, block_size: int = 16) -> bytes:
        """
        PKCS7 填充

        :param data: 需要填充的原始数据
        :param block_size: 块大小 (默认为 16)
        :return: 填充后的数据
        """
        pad_len = block_size - len(data) % block_size
        padding = bytes([pad_len]) * pad_len
        return data + padding

    @staticmethod
    def pkcs7_unpad(padded_data: bytes) -> bytes:
        """
        PKCS7 去除填充

        :param padded_data: 填充后的数据
        :return: 去除填充后的原始数据
        """
        pad_len = padded_data[-1]
        return padded_data[:-pad_len]

    def encrypt(self, plaintext: str) -> str:
        """
        AES-ECB 加密并返回 Base64 编码的密文

        :param plaintext: 要加密的明文
        :return: Base64 编码的密文
        """
        data = plaintext.encode("utf-8")
        padded = self.pkcs7_pad(data)

        cipher = AES.new(self.key, AES.MODE_ECB)
        encrypted_bytes = cipher.encrypt(padded)

        return base64.b64encode(encrypted_bytes).decode("utf-8")

    def decrypt(self, ciphertext_b64: str) -> str:
        """
        AES-ECB 解密 Base64 编码的密文

        :param ciphertext_b64: Base64 编码的密文
        :return: 解密后的明文
        """
        cipher_bytes = base64.b64decode(ciphertext_b64)

        cipher = AES.new(self.key, AES.MODE_ECB)
        padded_plaintext = cipher.decrypt(cipher_bytes)

        plaintext = self.pkcs7_unpad(padded_plaintext)
        return plaintext.decode("utf-8")
