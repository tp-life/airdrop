from dataclasses import dataclass

from web3 import AsyncWeb3

from py_app.util.evm import BaseContract

@dataclass(slots=True)
class GMContract(BaseContract):
    address: str = AsyncWeb3.to_checksum_address("0x59c27c39A126a9B5eCADdd460C230C857e1Deb35")
    abi_file: str = "seismic_gm.json"


@dataclass(slots=True)
class USDCContract(BaseContract):
    address:str = AsyncWeb3.to_checksum_address("0x64174552B1E07762fe2bBbdFBe558177688667B1")

@dataclass(slots=True)
class USDTContract(BaseContract):
    address:str = AsyncWeb3.to_checksum_address("0x0B60c43f7430c4467D17dAcd0016d8537355AE18")


@dataclass(slots=True)
class LiquidityContract(BaseContract):
    address: str = AsyncWeb3.to_checksum_address("0x2A643B85151C3Ad51F76aa09dBC477a6Db85277F")

@dataclass(slots=True)
class DeployNFTContract(BaseContract):
    address: str = AsyncWeb3.to_checksum_address("0x2de0c2c8135c16C87F05F74E4982c9376281B803")
