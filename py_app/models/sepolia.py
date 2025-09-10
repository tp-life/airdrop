from dataclasses import dataclass

from py_app.util.evm import BaseContract
from web3 import AsyncWeb3

@dataclass(slots=True)
class D3Contract(BaseContract):
    address: str = AsyncWeb3.to_checksum_address("0xb27ffc90C955A372307F99438a4F2d703b7c48b9")
    abi_file: str = "sepolia.json"
