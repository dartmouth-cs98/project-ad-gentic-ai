"""SSRF-safe HTTP client for brand import outbound requests."""

from __future__ import annotations

from urllib.parse import urljoin

import httpx

from services.brand_import.url_validation import BrandImportUrlError, validate_public_http_url

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
    """Async client that re-validates each redirect target before following."""
    event_hooks = dict(kwargs.pop("event_hooks", {}) or {})
    response_hooks = list(event_hooks.get("response") or [])
    response_hooks.append(_validate_redirect_response_hook)
    event_hooks["response"] = response_hooks
    return httpx.AsyncClient(event_hooks=event_hooks, follow_redirects=True, **kwargs)


def brand_import_sync_http_client(**kwargs: object) -> httpx.Client:
    """Sync client with the same redirect validation as brand_import_http_client."""
    event_hooks = dict(kwargs.pop("event_hooks", {}) or {})
    response_hooks = list(event_hooks.get("response") or [])
    response_hooks.append(_validate_redirect_target)
    event_hooks["response"] = response_hooks
    return httpx.Client(event_hooks=event_hooks, follow_redirects=True, **kwargs)
