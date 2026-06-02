"""DNS rebinding protection via connected-peer validation."""

from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock

import httpcore
import pytest

from services.brand_import.safe_http import (
    ValidatingAsyncNetworkBackend,
    ValidatingSyncNetworkBackend,
    _create_validating_async_transport,
    _create_validating_sync_transport,
    brand_import_http_client,
    brand_import_sync_http_client,
)
from services.brand_import.url_validation import BrandImportUrlError, validate_connected_ip


class _FakeStream:
    def __init__(self, peer_ip: str) -> None:
        self._peer_ip = peer_ip

    def get_extra_info(self, info: str) -> object:
        if info in {"server_addr", "peername"}:
            return (self._peer_ip, 443)
        return None

    async def aclose(self) -> None:
        return None


class _FakeAsyncStream(_FakeStream):
    async def read(self, max_bytes: int, timeout: float | None = None) -> bytes:
        return b""

    async def write(self, buffer: bytes, timeout: float | None = None) -> None:
        return None

    async def start_tls(self, ssl_context, server_hostname=None, timeout=None) -> _FakeAsyncStream:
        return self


def test_validate_connected_ip_rejects_private_peer():
    with pytest.raises(BrandImportUrlError, match="private|reserved"):
        validate_connected_ip("127.0.0.1")
    with pytest.raises(BrandImportUrlError, match="private|reserved"):
        validate_connected_ip("10.0.0.1")
    with pytest.raises(BrandImportUrlError, match="private|reserved"):
        validate_connected_ip("169.254.169.254")


def test_validate_connected_ip_allows_public_peer():
    validate_connected_ip("93.184.216.34")


@pytest.mark.asyncio
async def test_validating_async_backend_rejects_private_peer_after_connect():
    backend = ValidatingAsyncNetworkBackend()
    backend._backend.connect_tcp = AsyncMock(return_value=_FakeAsyncStream("127.0.0.1"))

    with pytest.raises(BrandImportUrlError, match="private|reserved"):
        await backend.connect_tcp("example.com", 443)


def test_validating_sync_backend_rejects_private_peer_after_connect():
    backend = ValidatingSyncNetworkBackend()
    backend._backend.connect_tcp = MagicMock(return_value=_FakeStream("127.0.0.1"))

    with pytest.raises(BrandImportUrlError, match="private|reserved"):
        backend.connect_tcp("example.com", 443)


@pytest.mark.asyncio
async def test_validating_async_backend_rejects_unix_socket():
    backend = ValidatingAsyncNetworkBackend()
    with pytest.raises(BrandImportUrlError, match="Unix domain"):
        await backend.connect_unix_socket("/tmp/evil.sock")


@pytest.mark.asyncio
async def test_brand_import_http_client_uses_peer_validating_transport():
    client = brand_import_http_client()
    try:
        backend = client._transport._pool._network_backend
        assert isinstance(backend, ValidatingAsyncNetworkBackend)
    finally:
        await client.aclose()


def test_brand_import_sync_http_client_uses_peer_validating_transport():
    client = brand_import_sync_http_client()
    try:
        backend = client._transport._pool._network_backend
        assert isinstance(backend, ValidatingSyncNetworkBackend)
    finally:
        client.close()


def test_create_validating_transports_reject_uds():
    with pytest.raises(BrandImportUrlError, match="Unix domain"):
        _create_validating_async_transport(uds="/tmp/evil.sock")
    with pytest.raises(BrandImportUrlError, match="Unix domain"):
        _create_validating_sync_transport(uds="/tmp/evil.sock")
