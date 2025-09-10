from abc import ABC, abstractmethod
from typing import Any, Callable, Optional, Union, Dict, Tuple
from time import sleep
import json

from hexbytes import HexBytes
from loguru import logger
from web3 import Web3
from web3.eth import Contract
from web3.middleware import ExtraDataToPOAMiddleware
from web3.types import TxReceipt, HexStr, ChecksumAddress

from py_app.exception.error import InsufficientException

# Constants
DEFAULT_GAS_LIMIT = 21000  # Standard transfer gas limit
DEFAULT_RETRIES = 10
DEFAULT_WAIT_TIME = 2
MAX_UINT256 = 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff


# evm gas 使用建议
# 网络状态	max_priority_fee_per_gas	max_fee_per_gas
# 低拥堵	    1-2	                        自动计算（无需指定）
# 中等拥堵	3-5	                        建议设为 base_fee * 2 + priority_fee
# 高拥堵（如 NFT 发售) 10+	            50+


class ContractBase(ABC):
    """Base class for blockchain contract interactions."""

    # Class constants
    ABI_FILE = ''
    ERC721_FILE = 'abi/erc721.json'
    ERC20_FILE = 'abi/erc_20.json'

    BASE_RPC = "https://mainnet.base.org"
    ABS_RPC = "https://api.mainnet.abs.xyz"
    POL_RPC = "https://polygon-rpc.com"

    w3:Optional[Web3] = None
    gas_multiplier = 1.2
    fallback_gas_limit = DEFAULT_GAS_LIMIT

    def __init__(self, rpc: str = "") -> None:
        """Initialize the contract base with optional RPC URL."""
        if rpc:
            self._initialize_web3(rpc)

    def _initialize_web3(self, rpc: str) -> None:
        """Initialize Web3 connection."""
        self.w3 = Web3(Web3.HTTPProvider(rpc))
        self.w3.middleware_onion.inject(ExtraDataToPOAMiddleware, layer=0)

        if not self.w3.is_connected():
            logger.error("Failed to connect to blockchain network!")
            raise ConnectionError("Failed to connect to blockchain network")
        logger.success("Successfully connected to blockchain network")

    @staticmethod
    def get_short_address(address: str) -> str:
        """Return shortened version of an address."""
        return f"{address[:6]}...{address[-4:]}"

    @staticmethod
    def get_short_hash(tx_hash: str) -> str:
        """Return shortened version of a transaction hash."""
        return f"{tx_hash[:6]}...{tx_hash[-4:]}"

    def get_w3(self, rpc_url: str, ip: str = "") -> Web3:
        """Get Web3 instance with optional proxy."""
        if not self.w3:
            proxy = {"http": ip, "https": ip} if ip else None
            self.w3 = Web3(Web3.HTTPProvider(
                rpc_url,
                request_kwargs={
                    "timeout": 30,
                    "proxies": proxy,
                }
            ))
            self.w3.middleware_onion.inject(ExtraDataToPOAMiddleware, layer=0)
        return self.w3

    def get_contract(self, contract_address: str, abi: Optional[list] = None, abi_file: str = '') -> Contract:
        """Get contract instance using ABI."""
        contract_address = self.w3.to_checksum_address(contract_address)

        # Load ABI
        abi_to_use = abi
        if not abi_to_use:
            abi_file = abi_file or self.ABI_FILE
            if not abi_file:
                raise ValueError("No ABI provided and no ABI file specified")

            with open(abi_file, 'r') as f:
                abi_to_use = json.load(f)

        if not abi_to_use:
            raise ValueError("No valid ABI available")

        return self.w3.eth.contract(address=contract_address, abi=abi_to_use)

    def get_balance(self, address: str) -> float:
        """Get ETH balance of an address in ether."""
        address = self.w3.to_checksum_address(address)
        balance_wei = self.w3.eth.get_balance(address)
        return self.w3.from_wei(balance_wei, 'ether')

    def _wait_for_transaction(self, tx_hash: HexStr | HexBytes | str, address: str = '') -> Union[HexStr, bool]:
        """Wait for transaction confirmation."""
        for _ in range(DEFAULT_RETRIES):
            try:
                receipt = self.w3.eth.get_transaction_receipt(tx_hash)
                if receipt is not None:
                    if receipt['status'] == 1:
                        logger.info(f"Transaction successful for {self.get_short_address(address)}")
                        return tx_hash
                    logger.warning(f"Transaction status incorrect, retrying... Receipt: {receipt}")
            except Exception as e:
                logger.error(f"Failed to get transaction receipt: {e}")
            sleep(DEFAULT_WAIT_TIME)
        return False

    def execute_contract_call(
            self,
            private_key: str,
            contract_address: str,
            call_function: Callable[[Web3, Contract], Any],
            amount: float = 0,
            min_balance: float = 0.00001,
            rpc_url: str = '',
            wait_for_receipt: bool = True,
            abi: Optional[list] = None,
            abi_file='',
            custom_gas_multiplier: float = None,
            custom_fallback_gas: int = None,
            custom_priority_fee_gwei: Optional[int] = None,  # 自动优先费支持
            force_legacy: bool = False,  # 强制使用传统交易模式（仅在不支持 EIP-1559 的链上需要）
    ) -> str | HexStr | bool:
        """Execute a contract call with EIP-1559 and legacy gas logic."""
        if not call_function:
            raise ValueError("No call function provided")

        w3 = self.get_w3(rpc_url)
        wallet = w3.eth.account.from_key(private_key)
        address = wallet.address

        balance = self.get_balance(address)
        if min_balance > 0 and balance < min_balance:
            error_msg = f"Insufficient balance for {self.get_short_address(address)}. Balance: {balance}"
            logger.error(error_msg)
            raise InsufficientException(error_msg)

        value = w3.to_wei(amount, "ether") if amount > 0 else 0
        if value > 0 and balance < amount:
            error_msg = f"Insufficient balance for transfer. Balance: {balance}, Required: {amount}"
            logger.error(error_msg)
            raise InsufficientException(error_msg)

        contract = self.get_contract(contract_address, abi=abi, abi_file=abi_file)
        transaction_data = call_function(w3, contract)
        if not transaction_data:
            raise ValueError("No transaction data returned from call function")

        nonce = w3.eth.get_transaction_count(address)
        gas_multiplier = custom_gas_multiplier or self.gas_multiplier
        fallback_gas = custom_fallback_gas or self.fallback_gas_limit

        tx_params = {
            'from': address,
            'nonce': nonce,
            'value': value
        }

        try:
            gas_estimate = transaction_data.estimate_gas(tx_params)
            tx_params['gas'] = int(gas_estimate * gas_multiplier)
            logger.debug(f"Estimated gas: {gas_estimate}, using: {tx_params['gas']}")
        except Exception as e:
            logger.warning(f"Gas estimation failed, using fallback gas: {fallback_gas}. Error: {str(e)}")
            tx_params['gas'] = fallback_gas

        # 判断是否支持 EIP-1559
        latest_block = w3.eth.get_block("latest")
        if "baseFeePerGas" in latest_block and not force_legacy:
            base_fee = latest_block["baseFeePerGas"]

            if custom_priority_fee_gwei is not None:
                priority_fee = w3.to_wei(custom_priority_fee_gwei, 'gwei')
            else:
                try:
                    priority_fee = int(w3.eth.max_priority_fee * 1.2)  # 自动推荐 + 20% buffer
                    logger.debug(f"Auto priority fee: {priority_fee}")
                except Exception as e:
                    priority_fee = w3.to_wei(2, 'gwei')  # fallback 值
                    logger.warning(f"Failed to get max_priority_fee. Fallback to 2 Gwei. Error: {str(e)}")

            max_fee = base_fee + priority_fee * 2  # 额外 buffer

            tx_params["maxFeePerGas"] = max_fee
            tx_params["maxPriorityFeePerGas"] = priority_fee
            logger.debug(f"EIP-1559 tx: baseFee={base_fee}, priority={priority_fee}, maxFee={max_fee}")
        else:
            tx_params["gasPrice"] = w3.eth.gas_price
            logger.debug(f"Legacy tx: gasPrice={tx_params['gasPrice']}")

        # tx_params['gasPrice'] = w3.to_wei('30', 'gwei')
        tx_params['gas'] = 500000

        # 构建、签名、发送交易
        transaction = transaction_data.build_transaction(tx_params)
        signed_tx = wallet.sign_transaction(transaction)
        try:
            tx_hash = w3.eth.send_raw_transaction(signed_tx.raw_transaction)
            logger.info(f"Transaction sent. Hash: {tx_hash.hex()}")

            if wait_for_receipt:
                return self._wait_for_transaction(tx_hash, address)
            return tx_hash.hex()
        except Exception as e:
            logger.error(f"Transaction failed: {str(e)}")
            raise

    def approve_erc20_token(
            self,
            private_key: str,
            token_address: str,
            spender: str,
            amount: int
    ) -> str:
        """Approve ERC20 token spending."""
        try:
            token_address = self.w3.to_checksum_address(token_address)
            wallet = self.w3.eth.account.from_key(private_key)
            address = wallet.address

            token_contract = self.get_contract(token_address, abi_file=self.ERC20_FILE)
            spender = self.w3.to_checksum_address(spender)

            current_allowance = token_contract.functions.allowance(address, spender).call()
            if current_allowance >= amount:
                logger.info("Token already approved")
                return "0x0"  # Return dummy hash for already approved

            logger.info(f"Approving token {self.get_short_address(token_address)}...")

            transaction = token_contract.functions.approve(spender, MAX_UINT256).build_transaction({
                'from': address,
                'gasPrice': self.w3.eth.gas_price,
                'nonce': self.w3.eth.get_transaction_count(address),
            })

            signed_tx = self.w3.eth.account.sign_transaction(transaction, private_key)
            tx_hash = self.w3.eth.send_raw_transaction(signed_tx.raw_transaction)
            logger.success(f"Approval transaction sent: {self.get_short_hash(tx_hash.hex())}")

            receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash)
            if receipt.status == 1:
                logger.success("Approval successful")
            else:
                logger.error(f"Approval failed. Receipt: {receipt}")
            return tx_hash.hex()
        except Exception as e:
            logger.error(f"Approval failed: {str(e)}")
            raise

    def send_transaction(
            self,
            private_key: str,
            to_address: str,
            amount: Union[int, float],
            token_address: Optional[str] = None
    ) -> str | HexStr:
        """Send either ETH or ERC20 tokens."""
        to_address = self.w3.to_checksum_address(to_address)
        if token_address:
            return self.send_erc20_token(private_key, to_address, amount, token_address)
        return self.send_eth(private_key, to_address, amount)

    def send_eth(
            self,
            private_key: str,
            to_address: str,
            amount_ether: float = 0,
            gas_buffer: float = 0.000001,
            gas_limit: int | None = None,
            max_priority_fee_per_gas: float | None = None,  # 单位: gwei
            max_fee_per_gas: float | None = None,  # 单位: gwei
            priority_fee_multiplier: float = 1.5,  # 自动计算小费时的乘数
            force_legacy: bool = False,  # 强制使用传统交易模式（仅在不支持 EIP-1559 的链上需要）
    ) -> HexStr |str:
        # return self._send_eth_v1(private_key, to_address, amount_ether, gas_buffer, gas_limit)
        return self._send_eth(private_key, to_address, amount_ether, gas_buffer, gas_limit, max_priority_fee_per_gas, max_fee_per_gas, priority_fee_multiplier, force_legacy)

    def send_erc20_token(self, private_key: str, to_address: str, amount: int, token_address: str) -> str:
        """Send ERC20 tokens to another address."""
        w3 = self.w3
        wallet = w3.eth.account.from_key(private_key)
        address = wallet.address

        token_contract = self.get_contract(token_address, abi_file=self.ERC20_FILE)

        support_dynamic_fee = 'baseFeePerGas' in w3.eth.get_block('latest')

        txn_params = {
            'from': address,
            'nonce': w3.eth.get_transaction_count(address),
        }

        # if support_dynamic_fee:
        #     txn_params['maxFeePerGas'] = w3.to_wei('50', 'gwei')
        #     txn_params['maxPriorityFeePerGas'] = w3.to_wei('2', 'gwei')
        # else:
        #     txn_params['gasPrice'] = w3.eth.gas_price

        transaction = token_contract.functions.transfer(
            w3.to_checksum_address(to_address),
            amount
        ).build_transaction(txn_params)

        transaction['gas'] = w3.eth.estimate_gas(transaction)

        signed_tx = wallet.sign_transaction(transaction)
        tx_hash = w3.eth.send_raw_transaction(signed_tx.raw_transaction)
        logger.info(f"ERC20 transfer sent. Hash: {tx_hash.hex()}")

        receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
        if receipt.status == 1:
            logger.success(f"ERC20 transfer confirmed: {receipt.transactionHash.hex()}")
        else:
            logger.error(f"ERC20 transfer failed: {receipt}")
        return tx_hash.hex()

    def get_erc721_balance(
            self,
            rpc_url: str,
            address: str,
            contract_address: str,
            ip: str = ''
    ) -> int:
        """Get ERC721 token balance of an address."""
        self.get_w3(rpc_url, ip)
        contract = self.get_contract(contract_address, abi_file=self.ERC721_FILE)
        return contract.functions.balanceOf(address).call()

    def _send_eth_v1(
            self,
            private_key: str,
            to_address: str,
            amount_ether: float = 0,
            gas_buffer: float = 0.000001,
            gas_limit: int = DEFAULT_GAS_LIMIT
    ) -> HexStr | str:
        """Send ETH to another address."""
        w3 = self.w3
        wallet = w3.eth.account.from_key(private_key)
        sender_addr = wallet.address

        # Get gas details
        gas_price = w3.eth.gas_price
        gas_fee = gas_price * DEFAULT_GAS_LIMIT
        balance = w3.eth.get_balance(sender_addr)

        if balance <= gas_fee:
            print("余额不足以支付gas费用")
            return ''
        # Calculate amount to send
        if amount_ether == 0:  # Send all
            amount_wei = balance - gas_fee - w3.to_wei(gas_buffer, 'ether')
            if amount_wei <= 0:
                amount_wei = balance - gas_fee
        else:
            amount_wei = w3.to_wei(amount_ether, 'ether')

        # Validate balance
        if amount_wei <= 0 or (amount_wei + gas_fee) > balance:
            raise InsufficientException(
                f"Insufficient balance! Need {w3.from_wei(amount_wei + gas_fee, 'ether'):.6f} ETH, "
                f"have {w3.from_wei(balance, 'ether'):.6f} ETH"
            )

        # Build and send transaction
        transaction = {
            'to': w3.to_checksum_address(to_address),
            'value': amount_wei,
            'gas': gas_limit,
            'gasPrice': gas_price,
            'nonce': w3.eth.get_transaction_count(sender_addr),
            'chainId': w3.eth.chain_id
        }

        try:
            signed_tx = wallet.sign_transaction(transaction)
            tx_hash = w3.eth.send_raw_transaction(signed_tx.raw_transaction)
            logger.info(f"ETH transaction sent. Hash: {tx_hash.hex()}")

            receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
            if receipt.status == 1:
                logger.success(f"Transaction confirmed: {receipt.transactionHash.hex()}")
            else:
                logger.error(f"Transaction failed: {receipt}")
            return tx_hash.hex()
        except Exception as e:
            logger.error(f"ETH transfer failed: {str(e)}")
            raise

    def _send_eth(
            self,
            private_key: str,
            to_address: str,
            amount_ether: float = 0,
            gas_buffer: float = 0.000001,
            gas_limit: int | None = None,
            max_priority_fee_per_gas: float | None = None,  # 单位: gwei
            max_fee_per_gas: float | None = None,  # 单位: gwei
            priority_fee_multiplier: float = 1.5,  # 自动计算小费时的乘数
            force_legacy: bool = False,  # 强制使用传统交易模式（仅在不支持 EIP-1559 的链上需要）
    ) -> HexStr | str:
        """Send ETH to another address.

        Args:
            private_key: 发送者的私钥
            to_address: 接收地址
            amount_ether: 发送数量(ETH单位)，0表示发送全部余额
            gas_buffer: 余额缓冲(ETH单位)，防止因gas波动导致失败
            gas_limit: 可选gas限制，None表示自动估算
            max_priority_fee_per_gas: 最大优先费(单位gwei)，None表示自动计算
            max_fee_per_gas: 最大费用(单位gwei)，None表示自动计算
            priority_fee_multiplier: 自动计算优先费时的乘数
            force_legacy: 强制使用传统交易模式（仅在不支持 EIP-1559 的链上需要）
        """

        w3 = self.w3
        wallet = w3.eth.account.from_key(private_key)
        sender_addr = wallet.address

        # 检查网络是否支持 EIP-1559
        latest_block = w3.eth.get_block('latest')
        supports_eip1559 = hasattr(latest_block, 'baseFeePerGas') and latest_block.baseFeePerGas is not None
        use_eip1559 = supports_eip1559 and not force_legacy  # 默认优先使用 EIP-1559

        # 获取余额
        balance = w3.eth.get_balance(sender_addr)

        gas_price = w3.eth.gas_price  # 自动获取当前 gas 价格

        # 设置 gas limit
        if gas_limit is None:
            try:
                gas_limit = w3.eth.estimate_gas({
                    'from': sender_addr,
                    'to': w3.to_checksum_address(to_address),
                    'value': w3.to_wei(1, 'ether')  # 估算时使用1 ETH，实际值后面会调整
                })
                gas_limit = int(gas_limit * 1.2)  # 添加20%缓冲
            except Exception as e:
                logger.warning(f"Failed to estimate gas, using default: {DEFAULT_GAS_LIMIT}. Error: {str(e)}")
                gas_limit = DEFAULT_GAS_LIMIT

        # 计算 gas 费用
        if use_eip1559:
            # EIP-1559 交易
            base_fee = latest_block.baseFeePerGas

            # 设置 max_priority_fee_per_gas
            if max_priority_fee_per_gas is None:
                max_priority_fee_per_gas = w3.to_wei(priority_fee_multiplier, 'gwei')
            else:
                max_priority_fee_per_gas = w3.to_wei(max_priority_fee_per_gas, 'gwei')

            # 设置 max_fee_per_gas
            if max_fee_per_gas is None:
                max_fee_per_gas = base_fee + max_priority_fee_per_gas * 2
            else:
                max_fee_per_gas = w3.to_wei(max_fee_per_gas, 'gwei')

            gas_fee = gas_limit * max_fee_per_gas
        else:
            # 传统交易模式（仅在不支持 EIP-1559 的链上使用）
            gas_fee = gas_limit * gas_price

        # 检查余额是否足够支付 gas 费用
        if balance <= gas_fee:
            raise InsufficientException(
                f"余额不足以支付 gas 费用! 需要 {w3.from_wei(gas_fee, 'ether'):.6f} ETH, "
                f"当前余额 {w3.from_wei(balance, 'ether'):.6f} ETH"
            )

        # 计算要发送的金额
        if amount_ether == 0:  # 发送全部余额
            amount_wei = balance - gas_fee - w3.to_wei(gas_buffer, 'ether')
            if amount_wei <= 0:
                amount_wei = balance - gas_fee
        else:
            amount_wei = w3.to_wei(amount_ether, 'ether')

        # 验证余额是否足够
        if amount_wei <= 0 or (amount_wei + gas_fee) > balance:
            raise InsufficientException(
                f"余额不足! 需要 {w3.from_wei(amount_wei + gas_fee, 'ether'):.6f} ETH, "
                f"当前余额 {w3.from_wei(balance, 'ether'):.6f} ETH"
            )

        # 构建交易
        transaction = {
            'to': w3.to_checksum_address(to_address),
            'value': amount_wei,
            'gas': gas_limit,
            'nonce': w3.eth.get_transaction_count(sender_addr),
            'chainId': w3.eth.chain_id,
        }

        # 设置 gas 价格参数
        if use_eip1559:
            transaction.update({
                'maxPriorityFeePerGas': max_priority_fee_per_gas,
                'maxFeePerGas': max_fee_per_gas,
            })
        else:
            transaction['gasPrice'] = gas_price  # 传统交易模式

        try:
            signed_tx = wallet.sign_transaction(transaction)
            tx_hash = w3.eth.send_raw_transaction(signed_tx.raw_transaction)
            logger.info(f"ETH 交易已发送. Hash: {tx_hash.hex()}")

            receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
            if receipt.status == 1:
                logger.success(f"交易确认: {receipt.transactionHash.hex()}")
            else:
                logger.error(f"交易失败: {receipt}")
            return tx_hash.hex()
        except Exception as e:
            logger.error(f"ETH 转账失败: {str(e)}")
            raise
