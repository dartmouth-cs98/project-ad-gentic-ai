"""SSRF-safe HTTP client for brand import outbound requests."""

from __future__ import annotations

import typing
from urllib.parse import urljoin

import httpcore
import httpx

from services.brand_import.url_validation import BrandImportUrlError, validate_connected_ip, validate_public_http_url

_REDIRECT_STATUS = frozenset({301, 302, 303, 307, 308})


def _validate_redirect_target(response: httpx.Response) -> None:
    if response.status_code not in _REDIRECT_STATUS:
        return
    location = response.headers.get("location")
    if not location:
        raise BrandImportUrlError("Redirect response missing Location header")
    next_url = urljoin(str(response.url), location)
    validate_public_http_url(next_url)


async def _validate_redirect_response_hook(response: httpx.Response) -> None:
    """Async hook required by httpx.AsyncClient (hooks are awaited)."""
    _validate_redirect_target(response)


def _peer_ip_from_stream(stream: httpcore.AsyncNetworkStream | httpcore.NetworkStream) -> str | None:
    for key in ("server_addr", "peername"):
        info = stream.get_extra_info(key)
        if not info:
            continue
        if isinstance(info, tuple) and info:
            return str(info[0])
        if isinstance(info, str):
            return info
    return None


def _validate_stream_peer(stream: httpcore.NetworkStream) -> None:
    peer_ip = _peer_ip_from_stream(stream)
    if peer_ip is None:
        raise BrandImportUrlError("Could not verify connected peer address")
    validate_connected_ip(peer_ip)


async def _validate_async_stream_peer(stream: httpcore.AsyncNetworkStream) -> None:
    peer_ip = _peer_ip_from_stream(stream)
    if peer_ip is None:
        raise BrandImportUrlError("Could not verify connected peer address")
    validate_connected_ip(peer_ip)


class ValidatingAsyncNetworkBackend(httpcore.AsyncNetworkBackend):
    """Wrap the default backend and reject private/reserved TCP peers after connect."""

    def __init__(self) -> None:
        self._backend = httpcore.AnyIOBackend()

    async def connect_tcp(
        self,
        host: str,
        port: int,
        timeout: float | None = None,
        local_address: str | None = None,
        socket_options: typing.Iterable[httpcore.SOCKET_OPTION] | None = None,
    ) -> httpcore.AsyncNetworkStream:
        stream = await self._backend.connect_tcp(
            host,
            port,
            timeout=timeout,
            local_address=local_address,
            socket_options=socket_options,
        )
        await _validate_async_stream_peer(stream)
        return stream

    async def connect_unix_socket(
        self,
        path: str,
        timeout: float | None = None,
        socket_options: typing.Iterable[httpcore.SOCKET_OPTION] | None = None,
    ) -> httpcore.AsyncNetworkStream:
        raise BrandImportUrlError("Unix domain sockets are not allowed")

    async def sleep(self, seconds: float) -> None:
        await self._backend.sleep(seconds)


class ValidatingSyncNetworkBackend(httpcore.NetworkBackend):
    """Sync backend wrapper with the same connected-peer validation."""

    def __init__(self) -> None:
        self._backend = httpcore.SyncBackend()

    def connect_tcp(
        self,
        host: str,
        port: int,
        timeout: float | None = None,
        local_address: str | None = None,
        socket_options: typing.Iterable[httpcore.SOCKET_OPTION] | None = None,
    ) -> httpcore.NetworkStream:
        stream = self._backend.connect_tcp(
            host,
            port,
            timeout=timeout,
            local_address=local_address,
            socket_options=socket_options,
        )
        _validate_stream_peer(stream)
        return stream

    def connect_unix_socket(
        self,
        path: str,
        timeout: float | None = None,
        socket_options: typing.Iterable[httpcore.SOCKET_OPTION] | None = None,
    ) -> httpcore.NetworkStream:
        raise BrandImportUrlError("Unix domain sockets are not allowed")

    def sleep(self, seconds: float) -> None:
        self._backend.sleep(seconds)


def _create_validating_async_transport(**kwargs: object) -> httpx.AsyncHTTPTransport:
    from httpx._config import DEFAULT_LIMITS, Limits, create_ssl_context

    verify = typing.cast("ssl.SSLContext | str | bool", kwargs.pop("verify", True))
    cert = kwargs.pop("cert", None)
    trust_env = typing.cast(bool, kwargs.pop("trust_env", True))
    http1 = typing.cast(bool, kwargs.pop("http1", True))
    http2 = typing.cast(bool, kwargs.pop("http2", False))
    limits = typing.cast(Limits, kwargs.pop("limits", DEFAULT_LIMITS))
    uds = typing.cast("str | None", kwargs.pop("uds", None))
    local_address = typing.cast("str | None", kwargs.pop("local_address", None))
    retries = typing.cast(int, kwargs.pop("retries", 0))
    socket_options = kwargs.pop("socket_options", None)

    if uds:
        raise BrandImportUrlError("Unix domain sockets are not allowed")

    ssl_context = create_ssl_context(verify=verify, cert=cert, trust_env=trust_env)
    pool = httpcore.AsyncConnectionPool(
        ssl_context=ssl_context,
        max_connections=limits.max_connections,
        max_keepalive_connections=limits.max_keepalive_connections,
        keepalive_expiry=limits.keepalive_expiry,
        http1=http1,
        http2=http2,
        local_address=local_address,
        retries=retries,
        socket_options=socket_options,
        network_backend=ValidatingAsyncNetworkBackend(),
    )
    transport = object.__new__(httpx.AsyncHTTPTransport)
    transport._pool = pool
    return transport


def _create_validating_sync_transport(**kwargs: object) -> httpx.HTTPTransport:
    from httpx._config import DEFAULT_LIMITS, Limits, create_ssl_context

    verify = typing.cast("ssl.SSLContext | str | bool", kwargs.pop("verify", True))
    cert = kwargs.pop("cert", None)
    trust_env = typing.cast(bool, kwargs.pop("trust_env", True))
    http1 = typing.cast(bool, kwargs.pop("http1", True))
    http2 = typing.cast(bool, kwargs.pop("http2", False))
    limits = typing.cast(Limits, kwargs.pop("limits", DEFAULT_LIMITS))
    uds = typing.cast("str | None", kwargs.pop("uds", None))
    local_address = typing.cast("str | None", kwargs.pop("local_address", None))
    retries = typing.cast(int, kwargs.pop("retries", 0))
    socket_options = kwargs.pop("socket_options", None)

    if uds:
        raise BrandImportUrlError("Unix domain sockets are not allowed")

    ssl_context = create_ssl_context(verify=verify, cert=cert, trust_env=trust_env)
    pool = httpcore.ConnectionPool(
        ssl_context=ssl_context,
        max_connections=limits.max_connections,
        max_keepalive_connections=limits.max_keepalive_connections,
        keepalive_expiry=limits.keepalive_expiry,
        http1=http1,
        http2=http2,
        local_address=local_address,
        retries=retries,
        socket_options=socket_options,
        network_backend=ValidatingSyncNetworkBackend(),
    )
    transport = object.__new__(httpx.HTTPTransport)
    transport._pool = pool
    return transport


def content_length_exceeds(headers: dict[str, str] | httpx.Headers, max_bytes: int) -> bool:
    """True when Content-Length is present and larger than max_bytes."""
    content_length = headers.get("content-length")
    if content_length is None:
        return False
    try:
        return int(content_length.strip()) > max_bytes
    except ValueError:
        return False


async def read_limited_response_body(
    response: httpx.Response,
    max_bytes: int,
    *,
    chunk_size: int = 64 * 1024,
) -> tuple[bytes, bool]:
    """Read up to max_bytes from an open streaming response; stop downloading early."""
    parts: list[bytes] = []
    total = 0
    truncated = False
    async for chunk in response.aiter_bytes(chunk_size):
        if not chunk:
            continue
        remaining = max_bytes - total
        if remaining <= 0:
            truncated = True
            break
        if len(chunk) > remaining:
            parts.append(chunk[:remaining])
            total += remaining
            truncated = True
            break
        parts.append(chunk)
        total += len(chunk)
    if truncated:
        await response.aclose()
    return b"".join(parts), truncated


def brand_import_http_client(**kwargs: object) -> httpx.AsyncClient:
    """Async client that validates redirects and connected peer IPs."""
    event_hooks = dict(kwargs.pop("event_hooks", {}) or {})
    response_hooks = list(event_hooks.get("response") or [])
    response_hooks.append(_validate_redirect_response_hook)
    event_hooks["response"] = response_hooks
    transport = kwargs.pop("transport", None) or _create_validating_async_transport()
    return httpx.AsyncClient(
        event_hooks=event_hooks,
        follow_redirects=True,
        transport=transport,
        **kwargs,
    )


def brand_import_sync_http_client(**kwargs: object) -> httpx.Client:
    """Sync client with redirect and connected-peer validation."""
    event_hooks = dict(kwargs.pop("event_hooks", {}) or {})
    response_hooks = list(event_hooks.get("response") or [])
    response_hooks.append(_validate_redirect_target)
    event_hooks["response"] = response_hooks
    transport = kwargs.pop("transport", None) or _create_validating_sync_transport()
    return httpx.Client(
        event_hooks=event_hooks,
        follow_redirects=True,
        transport=transport,
        **kwargs,
    )
