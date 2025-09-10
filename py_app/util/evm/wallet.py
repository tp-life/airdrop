import asyncio
import random
from decimal import Decimal
from typing import Any, Callable, Union

from better_proxy import Proxy
from eth_account import Account
from eth_account.messages import encode_defunct
from eth_typing import ChecksumAddress, HexStr
from loguru import logger
from pydantic import HttpUrl
from web3 import AsyncHTTPProvider, AsyncWeb3
from web3.contract import AsyncContract
from web3.eth import AsyncEth
from web3.middleware import ExtraDataToPOAMiddleware
from web3.types import Nonce, TxParams

from py_app.exception.error import InsufficientException, InsufficientFundsError, WalletError
from .evm_tool import get_call_data
from .onchain_model import BaseContract, ERC20Contract


class BlockchainError(Exception):
    """
    区块链相关错误的基类。
    """


class Wallet(AsyncWeb3):
    ZERO_ADDRESS = "0x0000000000000000000000000000000000000000"  # 零地址，用于表示原生代币（ETH）
    DEFAULT_TIMEOUT = 40  # 默认超时时间（秒）
    MAX_RETRIES = 3  # 最大重试次数

    def __init__(
        self,
        rpc_url: Union[HttpUrl, str],
        private_key: str = '',
        proxy: str | None = None,
        request_timeout: int = 30
    ) -> None:
        """
        初始化钱包实例。

        参数：
        - private_key: 私钥字符串。
        - rpc_url: 区块链节点的RPC URL。
        - proxy: 可选的代理配置。
        - request_timeout: 请求超时时间（秒）。
        """

        _p = Proxy.from_str(proxy) if proxy else None

        self._provider = AsyncHTTPProvider(
            str(rpc_url),
            request_kwargs={
                "proxy": _p.as_url if _p else None,
                "ssl": False,
                "timeout": request_timeout
            }
        )
        super().__init__(self._provider, modules={"eth": AsyncEth})
        self.middleware_onion.inject(ExtraDataToPOAMiddleware, layer=0)
        self.private_key = self._initialize_private_key(private_key)  # 初始化私钥
        self._contracts_cache: dict[str, AsyncContract] = {}  # 合约缓存
        self._is_closed = False  # 标记钱包是否已关闭

    async def __aenter__(self):
        """
        异步上下文管理器的进入方法。
        """
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """
        异步上下文管理器的退出方法，确保资源清理。
        """
        await self.close()

    async def close(self):
        """
        关闭钱包，清理资源。
        """
        if self._is_closed:
            return

        try:
            if self._provider:
                if isinstance(self._provider, AsyncHTTPProvider):
                    await self._provider.disconnect()
                    logger.error(
                        f"{self.__class__.__name__} -> close : Provider disconnected successfully")

            self._contracts_cache.clear()  # 清空合约缓存

        except Exception as e:
            logger.error(
                f"{self.__class__.__name__} -> close : Error during wallet cleanup: {str(e)}")
        finally:
            self._is_closed = True

    @staticmethod
    def _initialize_private_key(private_key: str) -> Account:
        """
        初始化并验证私钥。

        参数：
        - private_key: 私钥字符串。

        返回：
        - Account 对象。
        """
        try:
            stripped_key = private_key.strip().lower()
            if not stripped_key.startswith("0x"):
                formatted_key = f"0x{stripped_key}"
            else:
                formatted_key = stripped_key
            return Account.from_key(formatted_key)
        except (ValueError, AttributeError) as error:
            raise WalletError(
                f"Invalid private key format: {error}") from error

    @property
    def wallet_address(self) -> ChecksumAddress:
        """
        获取钱包地址（校验和格式）。
        """
        return self.private_key.address

    @property
    async def use_eip1559(self) -> bool:
        """
        检查当前网络是否支持 EIP-1559。

        返回：
        - 布尔值，表示是否支持 EIP-1559。
        """
        try:
            latest_block = await self.eth.get_block('latest')
            return 'baseFeePerGas' in latest_block
        except Exception as e:
            logger.error(
                f"{self.__class__.__name__} -> use_eip1559 :  Error checking EIP-1559 support:{e}")
            return False

    @staticmethod
    def _get_checksum_address(address: str) -> ChecksumAddress:
        """
        将地址转换为校验和格式。

        参数：
        - address: 原始地址字符串。

        返回：
        - 校验和格式的地址。
        """
        return AsyncWeb3.to_checksum_address(address)

    def set_private_key(self, private_key: str) -> None:
        self.private_key = self._initialize_private_key(private_key)  # 初始化私钥

    async def get_contract(self, contract: Union[BaseContract, str, object]) -> AsyncContract:
        """
        获取或缓存合约实例。

        参数：
        - contract: 合约地址、BaseContract 对象或类似对象。

        返回：
        - AsyncContract 对象。
        """
        if isinstance(contract, str):
            address = self._get_checksum_address(contract)
            if address not in self._contracts_cache:
                temp_contract = ERC20Contract(address="")
                abi = await temp_contract.get_abi()
                contract_instance = self.eth.contract(address=address, abi=abi)
                self._contracts_cache[address] = contract_instance
            return self._contracts_cache[address]

        if isinstance(contract, BaseContract):
            address = self._get_checksum_address(contract.address)

            if address not in self._contracts_cache:
                abi = await contract.get_abi()
                self._contracts_cache[address] = self.eth.contract(
                    address=address,
                    abi=abi
                )
            return self._contracts_cache[address]

        if hasattr(contract, "address") and hasattr(contract, "abi"):
            address = self._get_checksum_address(contract.address)
            if address not in self._contracts_cache:
                self._contracts_cache[address] = self.eth.contract(
                    address=address,
                    abi=contract.abi
                )
            return self._contracts_cache[address]

        raise TypeError(
            "Invalid contract type: expected BaseContract, str, or contract-like object")

    async def token_balance(self, token_address: str) -> int:
        """
        获取指定代币的余额。

        参数：
        - token_address: 代币合约地址。

        返回：
        - 代币余额（整数）。
        """
        contract = await self.get_contract(token_address)
        return await contract.functions.balanceOf(
            self._get_checksum_address(self.private_key.address)
        ).call()

    def _is_native_token(self, token_address: str) -> bool:
        """
        检查是否为原生代币（ETH）。

        参数：
        - token_address: 代币地址。

        返回：
        - 布尔值，表示是否为原生代币。
        """
        return token_address == self.ZERO_ADDRESS

    async def _get_cached_contract(self, token_address: str) -> AsyncContract:
        """
        获取缓存的合约实例，如果不存在则创建。

        参数：
        - token_address: 合约地址。

        返回：
        - AsyncContract 对象。
        """
        checksum_address = self._get_checksum_address(token_address)
        if checksum_address not in self._contracts_cache:
            self._contracts_cache[checksum_address] = await self.get_contract(checksum_address)
        return self._contracts_cache[checksum_address]

    async def convert_amount_to_decimals(self, amount: Decimal, token_address: str) -> int:
        """
        将金额转换为区块链格式（带小数位）。

        参数：
        - amount: 金额（Decimal 类型）。
        - token_address: 代币地址。

        返回：
        - 转换后的金额（整数）。
        """
        checksum_address = self._get_checksum_address(token_address)

        if self._is_native_token(checksum_address):
            return self.to_wei(Decimal(str(amount)), 'ether')

        contract = await self._get_cached_contract(checksum_address)
        decimals = await contract.functions.decimals().call()
        return int(Decimal(str(amount)) * Decimal(10 ** decimals))

    async def convert_amount_from_decimals(self, amount: int, token_address: str) -> float:
        """
        将区块链格式的金额转换为人类可读格式。

        参数：
        - amount: 金额（整数）。
        - token_address: 代币地址。

        返回：
        - 转换后的金额（浮点数）。
        """
        checksum_address = self._get_checksum_address(token_address)

        if self._is_native_token(checksum_address):
            return float(self.from_wei(amount, 'ether'))

        contract = await self._get_cached_contract(checksum_address)
        decimals = await contract.functions.decimals().call()
        return float(Decimal(amount) / Decimal(10 ** decimals))

    async def get_nonce(self) -> Nonce:
        """
        获取当前钱包的交易计数（nonce）。

        返回：
        - Nonce 对象。
        """
        for attempt in range(self.MAX_RETRIES):
            try:
                count = await self.eth.get_transaction_count(self.wallet_address, 'pending')
                return Nonce(count)
            except Exception as e:
                logger.error(
                    f"{self.__class__.__name__} get_nonce Failed to get nonce (attempt {attempt + 1}): {e}")
                if attempt < self.MAX_RETRIES - 1:
                    await asyncio.sleep(1)
                else:
                    raise RuntimeError(
                        f"Failed to get nonce after {self.MAX_RETRIES} attempts") from e

    async def check_balance(self) -> None:
        """
        检查钱包的 ETH 余额是否为空。

        如果余额为零，则抛出 InsufficientFundsError。
        """
        balance = await self.eth.get_balance(self.private_key.address)
        if balance <= 0:
            raise InsufficientFundsError("ETH balance is empty")

    async def human_balance(self) -> float:
        """
        获取钱包的 ETH 余额（人类可读格式）。

        返回：
        - ETH 余额（浮点数）。
        """
        balance = await self.eth.get_balance(self.private_key.address)
        return float(self.from_wei(balance, "ether"))

    async def has_sufficient_funds_for_tx(self, transaction: TxParams) -> bool:
        """
        检查钱包是否有足够的资金进行交易。

        参数：
        - transaction: 交易参数。

        返回：
        - 布尔值，表示是否有足够资金。
        """
        try:
            balance = await self.eth.get_balance(self.private_key.address)
            required = int(transaction.get('value', 0))

            if balance < required:
                required_eth = self.from_wei(required, 'ether')
                balance_eth = self.from_wei(balance, 'ether')
                raise InsufficientException(
                    f"Insufficient ETH balance. Required: {required_eth:.6f} ETH, Available: {balance_eth:.6f} ETH"
                )

            return True

        except ValueError as error:
            raise ValueError(
                f"Invalid transaction parameters: {str(error)}") from error
        except Exception as error:
            raise BlockchainError(
                f"Failed to check transaction availability: {str(error)}") from error

    async def get_signature(self, text: str, private_key: str | None = None) -> HexStr:
        """
        使用私钥对文本进行签名。

        参数：
        - text: 要签名的文本。
        - private_key: 可选的私钥。

        返回：
        - 签名的十六进制字符串。
        """
        try:
            signing_key = (
                self.from_key(private_key)
                if private_key
                else self.private_key
            )

            encoded = encode_defunct(text=text)
            signature = signing_key.sign_message(encoded).signature

            return HexStr(signature.hex())

        except Exception as error:
            raise ValueError(f"Signing failed: {str(error)}") from error

    async def _estimate_gas_params(
        self,
        tx_params: dict,
        gas_buffer: float = 1.2,
        gas_price_buffer: float = 1.15
    ) -> dict:
        """
        估算交易的 Gas 参数。

        参数：
        - tx_params: 交易参数。
        - gas_buffer: Gas 缓冲系数。
        - gas_price_buffer: Gas 价格缓冲系数。

        返回：
        - 更新后的交易参数字典。
        """
        try:
            if "gas" not in tx_params:
                gas_estimate = await self.eth.estimate_gas(tx_params)
                tx_params["gas"] = int(gas_estimate * gas_buffer)

            if await self.use_eip1559:
                latest_block = await self.eth.get_block('latest')
                base_fee = latest_block['baseFeePerGas']
                priority_fee = await self.eth.max_priority_fee

                tx_params.update({
                    "maxPriorityFeePerGas": int(priority_fee * gas_price_buffer),
                    "maxFeePerGas": int((base_fee * 2 + priority_fee) * gas_price_buffer)
                })
            else:
                tx_params["gasPrice"] = int(await self.eth.gas_price * gas_price_buffer)

            return tx_params
        except Exception as error:
            raise BlockchainError(
                f"Failed to estimate gas: {error}") from error

    async def build_transaction_params(
        self,
        contract_function: Any = None,
        to: str = None,
        value: int = 0,
        gas_buffer: float = 1.2,
        gas_price_buffer: float = 1.15,
        **kwargs
    ) -> dict:
        """
        构建交易参数。

        参数：
        - contract_function: 合约函数（可选）。
        - to: 接收地址（可选）。
        - value: 转账金额（整数）。
        - gas_buffer: Gas 缓冲系数。
        - gas_price_buffer: Gas 价格缓冲系数。
        - kwargs: 其他参数。

        返回：
        - 交易参数字典。
        """

        base_params = {
            "from": self.wallet_address,
            "nonce": await self.get_nonce(),
            "value": value,
            **kwargs
        }

        try:
            chain_id = await self.eth.chain_id
            base_params["chainId"] = chain_id
        except Exception as e:
            logger.error(
                f"{self.__class__.__name__} -> build_transaction_params : Failed to get chain_id: {e}")

        if contract_function is None:
            if to is None:
                raise ValueError("'to' address required for ETH transfers")
            base_params.update({"to": to})
            return await self._estimate_gas_params(base_params, gas_buffer, gas_price_buffer)
        print(base_params)
        tx_params = await contract_function.build_transaction({"nonce": 23, "value": self.to_wei(0.00015, "ether")})
        print(tx_params, "xcvxcvxcvxcv")
        return await self._estimate_gas_params(tx_params, gas_buffer, gas_price_buffer)

    async def _check_and_approve_token(
        self,
        token_address: str,
        spender_address: str,
        amount: int
    ) -> tuple[bool, str]:
        """
        检查并批准代币转账。

        参数：
        - token_address: 代币地址。
        - spender_address: 授权地址。
        - amount: 授权金额。

        返回：
        - 布尔值和消息字符串。
        """
        try:
            token_contract = await self.get_contract(token_address)

            current_allowance = await token_contract.functions.allowance(
                self.wallet_address,
                spender_address
            ).call()

            if current_allowance >= amount:
                return True, "Allowance already sufficient"

            approve_params = await self.build_transaction_params(
                contract_function=token_contract.functions.approve(
                    spender_address, amount)
            )

            success, result = await self._process_transaction(approve_params)
            if not success:
                raise WalletError(f"Approval failed: {result}")

            return True, "Approval successful"

        except Exception as error:
            return False, f"Error during approval: {str(error)}"

    async def send_and_verify_transaction(self, transaction: Any) -> tuple[bool, str]:
        """
        发送并验证交易。

        参数：
        - transaction: 交易参数。

        返回：
        - 布尔值和交易哈希或错误消息。
        """
        max_attempts = self.MAX_RETRIES
        current_attempt = 0
        last_error = None

        while current_attempt < max_attempts:
            tx_hash = None
            try:
                signed = self.private_key.sign_transaction(transaction)
                tx_hash = await self.eth.send_raw_transaction(signed.raw_transaction)

                receipt = await asyncio.wait_for(
                    self.eth.wait_for_transaction_receipt(tx_hash),
                    timeout=self.DEFAULT_TIMEOUT
                )

                return receipt["status"] == 1, tx_hash.hex()

            except asyncio.TimeoutError:
                if tx_hash:
                    logger.error(
                        f"{self.__class__.__name__} -> send_and_verify_transaction : Transaction confirmation timed out. Hash: {tx_hash.hex()}")
                    return False, f"PENDING:{tx_hash.hex()}"

            except Exception as error:
                error_str = str(error)
                last_error = error
                current_attempt += 1

                if "NONCE_TOO_SMALL" in error_str or "nonce too low" in error_str.lower():
                    logger.error(
                        f"{self.__class__.__name__} -> send_and_verify_transaction : Nonce too small. Current: {transaction.get('nonce')}. Getting new nonce.")
                    try:
                        new_nonce = await self.eth.get_transaction_count(self.wallet_address, 'pending')
                        if new_nonce <= transaction['nonce']:
                            new_nonce = transaction['nonce'] + 1
                        transaction['nonce'] = new_nonce

                        logger.error(
                            f"{self.__class__.__name__} -> send_and_verify_transaction : New nonce set: {new_nonce}")
                    except Exception as nonce_error:
                        logger.error(
                            f"{self.__class__.__name__} -> send_and_verify_transaction : Error getting new nonce: {str(nonce_error)}")

                    delay = random.uniform(1, 3) * (2 ** current_attempt)
                    await asyncio.sleep(delay)

        return False, f"Failed to execute transaction after {max_attempts} attempts. Last error: {str(last_error)}"

    async def _process_transaction(self, transaction: Any) -> tuple[bool, str]:
        """
        处理交易。

        参数：
        - transaction: 交易参数。

        返回：
        - 布尔值和交易结果或错误消息。
        """
        try:
            status, result = await self.send_and_verify_transaction(transaction)
            return status, result
        except Exception as error:
            return False, str(error)

    async def quick_do(self,
                       contract: Union[BaseContract, str, object] = None,
                       call_fn: Callable[[AsyncContract], Any] = None,
                       **kwargs):
        """
        快速执行交易。

        参数：
        - contract: 合约地址或对象。
        - call_function: 合约函数调用。
        - to: 接收地址（可选）。
        - value: 转账金额（整数）。
        - gas_buffer: Gas 缓冲系数。
        - gas_price_buffer: Gas 价格缓冲系数。
        - kwargs: 其他参数。

        返回：
        - 交易结果或错误消息。
        """
        cf = None
        if contract and call_fn:
            _contract = await self.get_contract(contract)
            cf = call_fn(_contract)
            print(cf, "XCCXVX")

        try:
            logger.info(f"Building transaction...")
            transaction = await self.build_transaction_params(
                contract_function=cf,
                **kwargs
            )
            logger.info(f"Transaction built: {transaction}")
            ok, msg = await self._process_transaction(transaction)
            logger.success(f"Transaction result {ok}, result: {msg}")
            return ok, msg
        except Exception as error:
            logger.error(f"Transaction failed: {error}")
            return False, str(error)

    async def _get_contract_addr(self, contract: Union[BaseContract, str, object]) -> str:
        """
               获取合约地址。
               参数：
               - contract: 合约地址、BaseContract 对象。

               返回：
               - str 合约地址。
               """
        if isinstance(contract, str):
            address = self._get_checksum_address(contract)
            return address

        if isinstance(contract, BaseContract) or hasattr(contract, "address"):
            address = self._get_checksum_address(contract.address)
            return address

        raise TypeError(
            "Invalid contract type: expected BaseContract, str, or contract-like object")

    async def call_do(self,
                      contract: Union[BaseContract, str, object],
                      method_id: str,
                      call_data=None,
                      raw_data=None,
                      value: int = 0,
                      gas_buffer: float = 1.2,
                      gas_price_buffer: float = 1.15,
                      **kwargs):

        if call_data is None:
            call_data = []

        # data_params = method_id
        #
        # for _p in call_data:
        #     data_params += encode_parameter(_p)

        contract_addr = await self._get_contract_addr(contract)
        data_params = get_call_data(method_id, *call_data)

        if raw_data:
            data_params = method_id + raw_data

        base_params = {
            "from": self.wallet_address,
            "nonce": await self.get_nonce(),
            "to": contract_addr,
            "value": value,
            "data": data_params,
            **kwargs
        }

        try:
            chain_id = await self.eth.chain_id
            base_params["chainId"] = chain_id
        except Exception as e:
            logger.error(
                f"{self.__class__.__name__} -> build_transaction_params : Failed to get chain_id: {e}")

        try:
            transaction = await self._estimate_gas_params(base_params, gas_buffer, gas_price_buffer)

            ok, msg = await self._process_transaction(transaction)
            logger.success(f"Transaction result {ok}, result: {msg}")
            return ok, msg
        except Exception as error:
            return False, str(error)
