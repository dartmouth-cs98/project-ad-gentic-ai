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


def brand_import_http_client(**kwargs: object) -> httpx.AsyncClient:
    """Async client that re-validates each redirect target before following."""
    event_hooks = dict(kwargs.pop("event_hooks", {}) or {})
    response_hooks = list(event_hooks.get("response") or [])
    response_hooks.append(_validate_redirect_response_hook)
    event_hooks["response"] = response_hooks
    return httpx.AsyncClient(event_hooks=event_hooks, follow_redirects=True, **kwargs)
