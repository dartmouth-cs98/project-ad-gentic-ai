"""Crawl host checks after HTTP redirects."""

from __future__ import annotations

import ipaddress
import sys
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch

import httpx
import pytest

_backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(_backend_dir))

from services.brand_import.fetcher import fetch_site_pages
from services.brand_import.url_validation import (
    is_canonical_host_redirect,
    redirect_allowed_for_crawl,
)


class _StreamContext:
    def __init__(self, response: MagicMock) -> None:
        self._response = response

    async def __aenter__(self) -> MagicMock:
        return self._response

    async def __aexit__(self, *args: object) -> bool:
        return False


def _html_stream_response(*, url: str, html: str) -> MagicMock:
    response = MagicMock(spec=httpx.Response)
    response.url = httpx.URL(url)
    response.status_code = 200
    response.headers = {"content-type": "text/html; charset=utf-8"}
    response.encoding = "utf-8"
    response.raise_for_status = MagicMock()

    async def aiter_bytes(chunk_size: int = 65536) -> object:
        yield html.encode("utf-8")

    response.aiter_bytes = aiter_bytes
    response.aclose = AsyncMock()
    return response


def test_is_canonical_host_redirect_allows_apex_and_www():
    assert is_canonical_host_redirect("example.com", "www.example.com")
    assert is_canonical_host_redirect("www.example.com", "example.com")
    assert is_canonical_host_redirect("example.com", "example.com")


def test_is_canonical_host_redirect_rejects_unrelated_hosts():
    assert not is_canonical_host_redirect("example.com", "other.example.com")
    assert not is_canonical_host_redirect("shop.example.com", "www.example.com")


def test_redirect_allowed_for_crawl_seed_canonical():
    allowed, new_host = redirect_allowed_for_crawl(
        request_url="https://example.com/",
        page_url="https://www.example.com/",
        submitted_host="example.com",
        crawl_origin="https://example.com/",
        is_seed_page=True,
    )
    assert allowed is True
    assert new_host == "www.example.com"


def test_redirect_allowed_for_crawl_rejects_seed_offsite():
    allowed, new_host = redirect_allowed_for_crawl(
        request_url="https://example.com/track",
        page_url="https://other.example.com/deals",
        submitted_host="example.com",
        crawl_origin="https://example.com/",
        is_seed_page=True,
    )
    assert allowed is False
    assert new_host is None


@pytest.mark.asyncio
async def test_fetch_skips_offsite_redirect_on_internal_link():
    from services.brand_import.url_validation import ValidatedUrl

    home_html = (
        '<html><body>'
        '<a href="https://www.example.com/products/widget">Widget</a>'
        "</body></html>"
    )
    evil_html = "<html><body><h1>Other store</h1></body></html>"

    client = AsyncMock()
    client.stream = MagicMock(
        side_effect=[
            _StreamContext(_html_stream_response(url="https://www.example.com/", html=home_html)),
            _StreamContext(
                _html_stream_response(
                    url="https://other.example.com/hijacked",
                    html=evil_html,
                )
            ),
        ]
    )
    client.__aenter__ = AsyncMock(return_value=client)
    client.__aexit__ = AsyncMock(return_value=None)

    validated = ValidatedUrl(
        original="https://www.example.com",
        normalized="https://www.example.com/",
        hostname="www.example.com",
    )

    with patch(
        "services.brand_import.fetcher.brand_import_max_pages",
        return_value=5,
    ), patch(
        "services.brand_import.fetcher.brand_import_http_client",
        return_value=client,
    ):
        result = await fetch_site_pages(validated)

    assert len(result.pages) == 1
    assert result.pages[0].url == "https://www.example.com/"
    assert any("Skipped offsite redirect" in w for w in result.warnings)
    assert client.stream.call_count == 2


@pytest.mark.asyncio
async def test_fetch_rejects_seed_offsite_open_redirect():
    from services.brand_import.url_validation import ValidatedUrl

    client = AsyncMock()
    client.stream = MagicMock(
        side_effect=[
            _StreamContext(
                _html_stream_response(
                    url="https://other.example.com/",
                    html="<html><body>evil</body></html>",
                )
            ),
        ]
    )
    client.__aenter__ = AsyncMock(return_value=client)
    client.__aexit__ = AsyncMock(return_value=None)

    validated = ValidatedUrl(
        original="https://example.com",
        normalized="https://example.com/",
        hostname="example.com",
    )

    with patch(
        "services.brand_import.fetcher.brand_import_max_pages",
        return_value=5,
    ), patch(
        "services.brand_import.fetcher.brand_import_http_client",
        return_value=client,
    ):
        with pytest.raises(RuntimeError, match="Could not fetch any HTML"):
            await fetch_site_pages(validated)


@pytest.mark.asyncio
async def test_fetch_skips_discovered_links_with_disallowed_ports():
    from services.brand_import.url_validation import ValidatedUrl

    home_html = (
        '<html><body>'
        '<a href="https://www.example.com:25/track">Bad port</a>'
        '<a href="https://www.example.com/products/widget">Widget</a>'
        "</body></html>"
    )
    product_html = "<html><body><h1>Widget</h1></body></html>"

    client = AsyncMock()
    client.stream = MagicMock(
        side_effect=[
            _StreamContext(_html_stream_response(url="https://www.example.com/", html=home_html)),
            _StreamContext(
                _html_stream_response(
                    url="https://www.example.com/products/widget",
                    html=product_html,
                )
            ),
        ]
    )
    client.__aenter__ = AsyncMock(return_value=client)
    client.__aexit__ = AsyncMock(return_value=None)

    validated = ValidatedUrl(
        original="https://www.example.com",
        normalized="https://www.example.com/",
        hostname="www.example.com",
    )

    with patch(
        "services.brand_import.url_validation._resolve_hostname_ips",
        return_value=[ipaddress.ip_address("93.184.216.34")],
    ), patch(
        "services.brand_import.fetcher.brand_import_max_pages",
        return_value=5,
    ), patch(
        "services.brand_import.fetcher.brand_import_http_client",
        return_value=client,
    ):
        result = await fetch_site_pages(validated)

    assert len(result.pages) == 2
    assert {p.url for p in result.pages} == {
        "https://www.example.com/",
        "https://www.example.com/products/widget",
    }
    assert client.stream.call_count == 2
    assert not any(":25" in call.args[1] for call in client.stream.call_args_list)
