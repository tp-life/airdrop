from dataclasses import dataclass

from py_app.util.evm import BaseContract
from web3 import AsyncWeb3

@dataclass(slots=True)
class MintContract(BaseContract):
    address: str = AsyncWeb3.to_checksum_address("0xa42f0ef2ea6092bc986e9abd53310c7f0ef34b1b")
    abi_file: str = "coresky_mint.json"



@dataclass(slots=True)
class OpenContract(BaseContract):
    address: str = AsyncWeb3.to_checksum_address("0xe9ae8d25d9de2a260d628d562e766f1dfcab96e0")
    abi_file: str = "coresky.json"
