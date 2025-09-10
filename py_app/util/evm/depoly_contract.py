import re
import random
from faker import Faker
from typing import Self

from loguru import logger

from .wallet import Wallet
from  .onchain_model import ERC20Contract


class ContractGeneratorData:
    def __init__(self):
        self.fake = Faker()

    def generate_contract_name(self) -> str:
        word = self.fake.word()
        contract_name = ''.join(x.capitalize() for x in word.split())
        contract_name = re.sub(r'[^a-zA-Z]', '', contract_name)
        return contract_name

    def generate_token_details(self) -> dict:
        return {
            'token_name': f"{self.fake.company()}",
            'token_symbol': self.generate_token_symbol(),
            'total_supply': self.generate_total_supply()
        }

    def generate_token_symbol(self, max_length: int = 5) -> str:
        symbol = ''.join(self.fake.random_uppercase_letter() for _ in range(min(max_length, 5)))
        return symbol

    def generate_total_supply(self) -> int:
        round_multipliers = [1000, 10_000, 100_000, 1_000_000]
        base_numbers = [1, 5, 10, 25, 50, 100]
        base = random.choice(base_numbers)
        multiplier = random.choice(round_multipliers)
        total_supply = base * multiplier
        return max(10_000, min(total_supply, 1_000_000))


class DeployContractWorker(Wallet):
    def __init__(self, pk: str, rpc: str, proxy = '') -> None:

        Wallet.__init__(self, private_key=pk, rpc_url=rpc, proxy=proxy)
        self.erc20_contract = ERC20Contract()

    async def __aenter__(self) -> Self:
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb) -> None:
        await Wallet.__aexit__(self, exc_type, exc_val, exc_tb)

    async def deploy_erc_20_contract(self) -> tuple[bool, str]:
        generator = ContractGeneratorData()
        token_details = generator.generate_token_details()
        name = token_details['token_name']
        symbol = token_details['token_symbol']
        total_supply = token_details['total_supply']
        decimals = 18
        initial_supply_wei = total_supply * 10 ** decimals

        logger.info(f"Preparing to deploy a contract {name} ({symbol})")

        abi = await self.erc20_contract.get_abi()
        bytecode = await self.erc20_contract.get_bytecode()
        _contract = self.eth.contract(abi=abi, bytecode=bytecode)

        deploy_tx = await _contract.constructor(name, symbol, initial_supply_wei).build_transaction({
            'from': self.wallet_address,
            'nonce': await self.get_nonce(),
            'gasPrice': await self.eth.gas_price,
            # 'gas': 2000000,  # 设置一个合理的 gas limit（根据合约复杂度调整）
        })

        gas_estimate = await self.eth.estimate_gas(deploy_tx)
        deploy_tx['gas'] = int(gas_estimate * 1.2)

        status, tx_hash = await self.send_and_verify_transaction(deploy_tx)

        if status:
            receipt = await self.eth.wait_for_transaction_receipt(tx_hash)
            deployed_address = receipt['contractAddress']
            logger.success(f"Contract deployed successfully at address: {deployed_address}")
            return status, tx_hash
        else:
            logger.error(f"Error deploying contract")
            return status, tx_hash

    def _string_to_hex_padded(self, s):
        hex_str = s.encode('utf-8').hex()
        padded_hex = hex_str.ljust(64, '0')
        return padded_hex

    async def _generate_erc20_contract_bytecode(self, name: str, symbol: str):
        name_len_hex = "{:064x}".format(len(name))
        name_hex = self._string_to_hex_padded(name)

        symbol_len_hex = "{:064x}".format(len(symbol))
        symbol_hex = self._string_to_hex_padded(symbol)

        bytecode = (
                "0000000000000000000000000000000000000000000000000000000000000040"  # name offset
                "0000000000000000000000000000000000000000000000000000000000000080"  # symbol offset
                + name_len_hex
                + name_hex
                + symbol_len_hex
                + symbol_hex
        )
        erc20_code = await self.erc20_contract.get_bytecode()
        return erc20_code + bytecode