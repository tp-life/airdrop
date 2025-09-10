import asyncio
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Any, ClassVar

import aiofiles
import orjson

class ContractError(Exception):
    """Base exception for contract-related errors"""
    pass

@dataclass(slots=True)
class BaseContract:
    address: str
    abi_file: str = "erc_20.json"

    _abi_cache: ClassVar[dict[str, tuple[list[dict[str, Any]], float]]] = {}
    _cache_lock: ClassVar[asyncio.Lock] = asyncio.Lock()
    _abi_path: ClassVar[Path] = Path("common/abi")
    CACHE_TTL: ClassVar[int] = 3600

    async def get_abi(self) -> list[dict[str, Any]]:
        async with self._cache_lock:
            await self._validate_cache()
            return self._abi_cache[self.abi_file][0]

    async def _validate_cache(self) -> None:
        current_time = time.time()
        if (cached := self._abi_cache.get(self.abi_file)) and (current_time - cached[1]) < self.CACHE_TTL:
            return
        await self._load_abi_file(current_time)

    async def _load_abi_file(self, timestamp: float) -> None:
        file_path = self._abi_path / self.abi_file
        try:
            async with aiofiles.open(file_path, "rb") as f:
                content = await asyncio.to_thread(file_path.read_bytes)
                abi_data = orjson.loads(content)
                if not isinstance(abi_data, list):
                    raise ContractError(f"Invalid ABI structure in {file_path}")
                self._abi_cache[self.abi_file] = (abi_data, timestamp)
        except FileNotFoundError as e:
            raise ContractError(f"ABI file not found: {file_path}") from e
        except orjson.JSONDecodeError as e:
            raise ContractError(f"Invalid JSON in ABI file: {file_path}") from e

    @classmethod
    async def clear_cache(cls, abi_file: str | None = None) -> None:
        async with cls._cache_lock:
            if abi_file:
                cls._abi_cache.pop(abi_file, None)
            else:
                cls._abi_cache.clear()

@dataclass(slots=True)
class ERC20Contract(BaseContract):
    address: str = ""
    abi_file: str = "erc_20.json"
    _bytecode: str | None = None

    _bytecode_path: ClassVar[Path] = Path("./config/data")
    _bytecode_file: ClassVar[str] = "bytecode_erc_20.txt"
    _bytecode_cache: ClassVar[dict[str, str]] = {}
    _bytecode_lock: ClassVar[asyncio.Lock] = asyncio.Lock()

    @property
    def bytecode(self) -> str | None:
        return self._bytecode

    @bytecode.setter
    def bytecode(self, value: str | None) -> None:
        self._bytecode = value

    async def get_bytecode(self) -> str:
        if self._bytecode is not None:
            return self._bytecode

        cache_key = str(self._bytecode_path / self._bytecode_file)
        async with self._bytecode_lock:
            if cache_key in self._bytecode_cache:
                self._bytecode = self._bytecode_cache[cache_key]
                return self._bytecode

            file_path = self._bytecode_path / self._bytecode_file
            try:
                async with aiofiles.open(file_path, "r") as f:
                    bytecode = await f.read()
                    bytecode = bytecode.strip()
                    self._bytecode_cache[cache_key] = bytecode
                    self._bytecode = bytecode
                    return bytecode
            except FileNotFoundError as e:
                raise ContractError(f"Bytecode not found: {file_path}") from e
            except Exception as e:
                raise ContractError(f"Error reading bytecode: {e}") from e

    @classmethod
    async def clear_bytecode_cache(cls) -> None:
        async with cls._bytecode_lock:
            cls._bytecode_cache.clear()
