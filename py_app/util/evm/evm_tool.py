import random
import string

from ecdsa import SigningKey, SECP256k1
from eth_account import Account
from eth_account.messages import encode_defunct
from eth_utils import remove_0x_prefix, is_address, is_hex

from web3 import Web3
from eth_utils import to_checksum_address
import re

# 全局执行一次
Account.enable_unaudited_hdwallet_features()

# 生成随机Nonce
def generate_nonce():
    characters = string.ascii_letters + string.digits
    nonce = ''.join(random.choice(characters) for _ in range(17))
    return nonce

# 从字符串转换为私钥
def private_key_from_string(private_key_str):
    try:
        private_key_str = remove_0x_prefix(private_key_str)
        private_key_bytes = bytes.fromhex(private_key_str)
        return SigningKey.from_string(private_key_bytes, curve=SECP256k1)
    except ValueError as e:
        print(f"❌ 私钥转换失败: {e}")
        return None

# 对消息进行签名
def sign_message(private_key, message):
    return "0x"+Account().sign_message(encode_defunct(text=message), private_key).signature.hex()


def create_evm():
    # 生成一个新的私钥和地址
    account = Account.create()
    # 获取私钥（注意：私钥要安全存储）
    private_key = account.key.hex()
    # 获取钱包地址
    address = account.address
    return  address, private_key


def mnemonic_to_account(mnemonic: str, index: int = 0) -> tuple[str, str]:
    path = f"m/44'/60'/0'/0/{index}"
    account = Account.from_mnemonic(mnemonic, account_path=path)
    return account.key.hex(), account.address




def encode_uint(value, bits=256):
    """
    编码 uint 类型 (uint8, uint16, ..., uint256)

    参数:
        value: 要编码的非负整数
        bits: 位数 (8, 16, ..., 256)

    返回:
        32字节的十六进制编码字符串

    示例:
        >>> encode_uint(123, 256)
        '000000000000000000000000000000000000000000000000000000000000007b'
        >>> encode_uint(255, 8)
        '00000000000000000000000000000000000000000000000000000000000000ff'
    """
    if not isinstance(value, int) or value < 0:
        raise ValueError("uint value must be a non-negative integer")
    max_value = 2 ** bits - 1
    if value > max_value:
        raise ValueError(f"uint{bits} value exceeds maximum ({max_value})")
    return value.to_bytes(32, byteorder='big').hex()


def encode_int(value, bits=256):
    """
    编码 int 类型 (int8, int16, ..., int256)

    参数:
        value: 要编码的整数（可正可负）
        bits: 位数 (8, 16, ..., 256)

    返回:
        32字节的十六进制编码字符串

    示例:
        >>> encode_int(-123, 256)
        'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff85'
        >>> encode_int(32767, 16)
        '0000000000000000000000000000000000000000000000000000000000007fff'
    """
    if not isinstance(value, int):
        raise ValueError("int value must be an integer")
    min_value = -2 ** (bits - 1)
    max_value = 2 ** (bits - 1) - 1
    if not (min_value <= value <= max_value):
        raise ValueError(f"int{bits} value out of range ({min_value} to {max_value})")
    if value < 0:
        value = (1 << bits) + value  # 转换为补码形式
    return value.to_bytes(32, byteorder='big').hex()


def encode_address(address):
    """
    编码 address 类型 (20字节，右填充到32字节)

    参数:
        address: 以太坊地址字符串 (带或不带0x前缀)

    返回:
        32字节的十六进制编码字符串

    示例:
        >>> encode_address("0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B")
        '000000000000000000000000ab5801a7d398351b8be11c439e05c5b3259aec9b'
        >>> encode_address("ab5801a7d398351b8be11c439e05c5b3259aec9b")
        '000000000000000000000000ab5801a7d398351b8be11c439e05c5b3259aec9b'
    """
    if not Web3.is_address(address):
        raise ValueError("Invalid address format")
    checksum_addr = to_checksum_address(address)
    return checksum_addr[2:].zfill(64)  # 去掉0x，左补零到64字符


def encode_bool(value):
    """
    编码 bool 类型 (true=1, false=0)

    参数:
        value: 布尔值 (True/False)

    返回:
        32字节的十六进制编码字符串

    示例:
        >>> encode_bool(True)
        '0000000000000000000000000000000000000000000000000000000000000001'
        >>> encode_bool(False)
        '0000000000000000000000000000000000000000000000000000000000000000'
    """
    if not isinstance(value, bool):
        raise ValueError("bool value must be True or False")
    return '1'.zfill(64) if value else '0'.zfill(64)


def encode_bytes(value, fixed=False):
    """
    编码 bytes 类型 (动态或固定长度)

    参数:
        value: 要编码的字节数据 (bytes对象或hex字符串)
        fixed: 是否为固定长度bytes

    返回:
        十六进制编码字符串

    示例:
        # 固定长度bytes32
        >>> encode_bytes("616263", fixed=True)  # "abc"
        '6162630000000000000000000000000000000000000000000000000000000000'

        # 动态长度bytes
        >>> encode_bytes("616263646566")  # "abcdef"
        '0000000000000000000000000000000000000000000000000000000000000003'  # 长度
        '6162636465660000000000000000000000000000000000000000000000000000'  # 数据(补齐)
    """
    if not isinstance(value, (bytes, str)):
        raise ValueError("bytes value must be bytes or hex string")

    if isinstance(value, str):
        if value.startswith('0x'):
            value = bytes.fromhex(value[2:])
        else:
            value = bytes.fromhex(value)

    if fixed:
        # 固定长度bytes (如bytes32)
        if len(value) > 32:
            raise ValueError("fixed bytes length cannot exceed 32 bytes")
        return value.hex().ljust(64, '0')
    else:
        # 动态长度bytes
        length = len(value)
        # 第一部分：长度的编码
        length_encoding = encode_uint(length)
        # 第二部分：数据编码（32字节对齐）
        data_encoding = value.hex().ljust((((length + 31) // 32) * 64), '0')
        return length_encoding + data_encoding


def encode_string(value):
    """
    编码 string 类型 (动态长度)

    参数:
        value: 要编码的字符串

    返回:
        十六进制编码字符串 (长度+数据)

    示例:
        >>> encode_string("Hello, Web3!")
        '000000000000000000000000000000000000000000000000000000000000000c'  # 长度12
        '48656c6c6f2c2057656233210000000000000000000000000000000000000000'  # "Hello, Web3!"的UTF-8编码
    """
    if not isinstance(value, str):
        raise ValueError("string value must be a string")
    # 转换为utf-8 bytes然后像动态bytes一样编码
    return encode_bytes(value.encode('utf-8'), fixed=False)


def encode_array(values, element_type):
    """
    编码数组类型 (动态长度)

    参数:
        values: 要编码的数组 (列表或元组)
        element_type: 元素类型字符串 (如 "uint256", "address"等)

    返回:
        十六进制编码字符串 (长度+各元素编码)

    示例:
        # uint256数组
        >>> encode_array([1, 2, 3], "uint256")
        '0000000000000000000000000000000000000000000000000000000000000003'  # 长度3
        '0000000000000000000000000000000000000000000000000000000000000001'  # 元素1
        '0000000000000000000000000000000000000000000000000000000000000002'  # 元素2
        '0000000000000000000000000000000000000000000000000000000000000003'  # 元素3

        # 地址数组
        >>> addresses = [
        ...     "0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B",
        ...     "0xCA35b7d915458EF540aDe6068dFe2F44E8fa733c"
        ... ]
        >>> encode_array(addresses, "address")
        '0000000000000000000000000000000000000000000000000000000000000002'  # 长度2
        '000000000000000000000000ab5801a7d398351b8be11c439e05c5b3259aec9b'  # 地址1
        '000000000000000000000000ca35b7d915458ef540ade6068dfe2f44e8fa733c'  # 地址2
    """
    if not isinstance(values, (list, tuple)):
        raise ValueError("array value must be a list or tuple")

    # 第一部分：数组长度的编码
    length_encoding = encode_uint(len(values))

    # 第二部分：每个元素的编码
    elements_encoding = ''
    for item in values:
        if element_type.startswith('uint'):
            bits = int(element_type[4:])
            elements_encoding += encode_uint(item, bits)
        elif element_type.startswith('int'):
            bits = int(element_type[3:])
            elements_encoding += encode_int(item, bits)
        elif element_type == 'address':
            elements_encoding += encode_address(item)
        elif element_type == 'bool':
            elements_encoding += encode_bool(item)
        elif element_type == 'string':
            elements_encoding += encode_string(item)
        elif element_type.startswith('bytes'):
            if element_type == 'bytes':
                elements_encoding += encode_bytes(item, fixed=False)
            else:
                # 固定长度bytes (如bytes32)
                size = int(element_type[5:])
                elements_encoding += encode_bytes(item, fixed=True)
        else:
            raise ValueError(f"Unsupported array element type: {element_type}")

    return length_encoding + elements_encoding


def encode_tuple(values, types):
    """
    编码元组类型 (固定长度复合类型)

    参数:
        values: 要编码的值列表/元组
        types: 对应的类型字符串列表

    返回:
        十六进制编码字符串 (各元素按顺序编码)

    示例:
        >>> encode_tuple(
        ...     (123, "0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B", True),
        ...     ["uint256", "address", "bool"]
        ... )
        '000000000000000000000000000000000000000000000000000000000000007b'  # uint256 123
        '000000000000000000000000ab5801a7d398351b8be11c439e05c5b3259aec9b'  # address
        '0000000000000000000000000000000000000000000000000000000000000001'  # bool true
    """
    if not isinstance(values, (list, tuple)) or len(values) != len(types):
        raise ValueError("tuple values and types must have same length")

    encoded_parts = []
    for value, type_str in zip(values, types):
        if type_str.startswith('uint'):
            bits = int(type_str[4:])
            encoded_parts.append(encode_uint(value, bits))
        elif type_str.startswith('int'):
            bits = int(type_str[3:])
            encoded_parts.append(encode_int(value, bits))
        elif type_str == 'address':
            encoded_parts.append(encode_address(value))
        elif type_str == 'bool':
            encoded_parts.append(encode_bool(value))
        elif type_str == 'string':
            encoded_parts.append(encode_string(value))
        elif type_str.startswith('bytes'):
            if type_str == 'bytes':
                encoded_parts.append(encode_bytes(value, fixed=False))
            else:
                size = int(type_str[5:])
                encoded_parts.append(encode_bytes(value, fixed=True))
        else:
            raise ValueError(f"Unsupported tuple element type: {type_str}")

    return ''.join(encoded_parts)


def encode_parameter(value, type_str=None):
    """
    增强版通用编码方法：
    - 当传入type_str时，按指定类型编码
    - 当未传入type_str时，自动推断类型并编码

    参数:
        value: 要编码的值
        type_str: (可选) Solidity类型字符串

    返回:
        十六进制编码字符串

    示例:
        # 自动推断类型
        >>> encode_parameter(123)  # 推断为uint256
        '000000000000000000000000000000000000000000000000000000000000007b'

        >>> encode_parameter("0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B")  # 推断为address
        '000000000000000000000000ab5801a7d398351b8be11c439e05c5b3259aec9b'

        # 指定类型
        >>> encode_parameter(123, "uint8")
        '000000000000000000000000000000000000000000000000000000000000007b'

        >>> encode_parameter("616263", "bytes")  # 明确指定为动态bytes
        '0000000000000000000000000000000000000000000000000000000000000003'
        '6162630000000000000000000000000000000000000000000000000000000000'
    """
    if type_str is not None:
        # 如果有指定类型，按原逻辑处理
        return _encode_with_type(value, type_str)
    else:
        # 自动类型推断
        return _infer_and_encode(value)


def _encode_with_type(value, type_str):
    """按指定类型编码"""
    if type_str.startswith('uint'):
        bits = int(re.search(r'uint(\d+)', type_str).group(1))
        return encode_uint(value, bits)
    elif type_str.startswith('int'):
        bits = int(re.search(r'int(\d+)', type_str).group(1))
        return encode_int(value, bits)
    elif type_str == 'address':
        return encode_address(value)
    elif type_str == 'bool':
        return encode_bool(value)
    elif type_str == 'string':
        return encode_string(value)
    elif type_str.startswith('bytes'):
        if type_str == 'bytes':
            return encode_bytes(value, fixed=False)
        else:
            size = int(type_str[5:])
            return encode_bytes(value, fixed=True)
    elif '[' in type_str and ']' in type_str:
        # 数组类型
        element_type = type_str[:type_str.index('[')]
        return encode_array(value, element_type)
    elif '(' in type_str and ')' in type_str:
        # 元组类型
        types = [t.strip() for t in type_str[1:-1].split(',') if t.strip()]
        return encode_tuple(value, types)
    else:
        raise ValueError(f"Unsupported type: {type_str}")


def _infer_and_encode(value):
    """自动推断类型并编码"""
    if isinstance(value, bool):
        return encode_bool(value)
    elif isinstance(value, int):
        # 整数：默认为uint256，负数则为int256
        if value >= 0:
            return encode_uint(value, 256)
        else:
            return encode_int(value, 256)
    elif is_address(value):
        return encode_address(value)
    elif isinstance(value, str):
        # 字符串：可能是address、hex string或普通字符串
        if is_address(value):
            return encode_address(value)
        elif is_hex(value) and value.startswith('0x'):
            # 以0x开头的hex字符串，推断为bytes
            return encode_bytes(value, fixed=False)
        else:
            # 普通字符串
            return encode_string(value)
    elif isinstance(value, (bytes, bytearray)):
        return encode_bytes(value, fixed=False)
    elif isinstance(value, (list, tuple)):
        if len(value) == 0:
            raise ValueError("无法推断空数组的类型")

        # 尝试推断数组元素类型
        first_element_type = _infer_solidity_type(value[0])

        # 检查所有元素是否同类型
        for item in value[1:]:
            if _infer_solidity_type(item) != first_element_type:
                raise ValueError("数组元素类型不一致，请明确指定类型")

        # 编码数组
        return encode_array(value, first_element_type)
    else:
        raise ValueError(f"无法推断类型: {type(value)}")


def _infer_solidity_type(value):
    """推断单个值的Solidity类型"""
    if isinstance(value, bool):
        return "bool"
    elif isinstance(value, int):
        return "uint256" if value >= 0 else "int256"
    elif is_address(value):
        return "address"
    elif isinstance(value, str):
        if is_address(value):
            return "address"
        elif is_hex(value) and value.startswith('0x'):
            return "bytes"
        else:
            return "string"
    elif isinstance(value, (bytes, bytearray)):
        return "bytes"
    else:
        raise ValueError(f"无法推断类型: {type(value)}")


def get_function_selector(function_signature):
    """
    计算 Solidity 函数的方法 ID（function selector）

    参数:
        function_signature (str): 函数签名，如 "transfer(address,uint256)"

    返回:
        str: 方法 ID（如 "0xa9059cbb"）
    """
    # 计算 Keccak-256 哈希
    keccak_hash = Web3.keccak(text=function_signature).hex()

    # 取前 4 个字节（8 位十六进制）
    function_selector = keccak_hash[:10]  # "0x" + 8 个字符

    return function_selector


def get_call_data(methodID:str, *args) ->str:
    data_params = methodID

    for _p in args:
        data_params += encode_parameter(_p)

    return data_params
