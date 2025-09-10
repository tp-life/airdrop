from web3 import AsyncWeb3
from dataclasses import dataclass
from py_app.util.evm import BaseContract


@dataclass(slots=True)
class SpaceAndTimeContract(BaseContract):
    address: str = AsyncWeb3.to_checksum_address("0x09a7468E7Ab6416DC2837D6F87B5714Ee5A51C52")
    abi_file: str = "space.json"



@dataclass(slots=True)
class SpaceAndTimeSendContract(BaseContract):
    address: str = AsyncWeb3.to_checksum_address("0xE6Bfd33F52d82Ccb5b37E16D3dD81f9FFDAbB195")
    abi_file: str = "space_sent.json"
