from dataclasses import dataclass

from web3 import AsyncWeb3

from py_app.util.evm.onchain_model import BaseContract


@dataclass(slots=True)
class PingPongRouterContract(BaseContract):
    address: str = AsyncWeb3.to_checksum_address("0x6aac14f090a35eea150705f72d90e4cdc4a49b2c")
    abi_file: str = "ping_pong_router.json"

@dataclass(slots=True)
class PingTokensContract(BaseContract):
    address: str = AsyncWeb3.to_checksum_address("0x33e7fab0a8a5da1a923180989bd617c9c2d1c493")
    abi_file: str = "mint_tokens.json"

@dataclass(slots=True)
class PongTokensContract(BaseContract):
    address: str = AsyncWeb3.to_checksum_address("0x9beaA0016c22B646Ac311Ab171270B0ECf23098F")
    abi_file: str = "mint_tokens.json"

@dataclass(slots=True)
class UsdtTokensContract(BaseContract):
    address: str = AsyncWeb3.to_checksum_address("0x65296738d4e5edb1515e40287b6fdf8320e6ee04")
    abi_file: str = "mint_tokens.json"

@dataclass(slots=True)
class OnchainGMContract(BaseContract):
    address: str = AsyncWeb3.to_checksum_address("0xA0692f67ffcEd633f9c5CfAefd83FC4F21973D01")

@dataclass(slots=True)
class YappersNFTContract(BaseContract):
    address: str = AsyncWeb3.to_checksum_address("0xF6e220FA8d944B512e9ef2b1d732C3a12F156B3c")
    abi_file: str = "claim_nft.json"

@dataclass(slots=True)
class ShannonNFTContract(BaseContract):
    address: str = AsyncWeb3.to_checksum_address("0x715A73f6C71aB9cB32c7Cc1Aa95967a1b5da468D")
    abi_file: str = "claim_nft.json"

@dataclass(slots=True)
class ZNSContract(BaseContract):
    address: str = AsyncWeb3.to_checksum_address("0xf180136DdC9e4F8c9b5A9FE59e2b1f07265C5D4D")
    abi_file: str = "zns_domen.json"


@dataclass(slots=True)
class RefferralContract(BaseContract):
    address: str = AsyncWeb3.to_checksum_address("0x92A9207966971830270CB4886c706fdF5e98a38D")
    abi_file: str = "somnia_refferral.json"
