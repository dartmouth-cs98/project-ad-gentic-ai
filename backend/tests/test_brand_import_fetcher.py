"""Fetcher uses post-redirect URL as page base and streams response bodies."""

from __future__ import annotations

import sys
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch

import httpx
import pytest

_backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(_backend_dir))

from services.brand_import.fetcher import effective_page_url, fetch_site_pages
from services.brand_import.safe_http import read_limited_response_body
from services.brand_import.url_validation import ValidatedUrl


class _StreamContext:
    def __init__(self, response: MagicMock) -> None:
        self._response = response

    async def __aenter__(self) -> MagicMock:
        return self._response

    async def __aexit__(self, *args: object) -> bool:
        return False


def _html_stream_response(
    *,
    url: str,
    html: str,
    content_type: str = "text/html; charset=utf-8",
) -> MagicMock:
    body = html.encode("utf-8")
    response = MagicMock(spec=httpx.Response)
    response.url = httpx.URL(url)
    response.status_code = 200
    response.headers = {"content-type": content_type}
    response.encoding = "utf-8"
    response.raise_for_status = MagicMock()

    async def aiter_bytes(chunk_size: int = 65536) -> object:
        yield body

    response.aiter_bytes = aiter_bytes
    response.aclose = AsyncMock()
    return response


def _mock_streaming_client(responses: list[MagicMock]) -> AsyncMock:
    client = AsyncMock()
    client.stream = MagicMock(side_effect=[_StreamContext(r) for r in responses])
    client.__aenter__ = AsyncMock(return_value=client)
    client.__aexit__ = AsyncMock(return_value=None)
    return client


@pytest.mark.asyncio
async def test_read_limited_response_body_stops_at_cap():
    chunks = [b"a" * 100_000, b"b" * 100_000, b"c" * 100_000]

    async def aiter_bytes(chunk_size: int = 65536) -> object:
        for chunk in chunks:
            yield chunk

    response = MagicMock(spec=httpx.Response)
    response.aiter_bytes = aiter_bytes
    response.aclose = AsyncMock()

    body, truncated = await read_limited_response_body(response, 150_000)

    assert len(body) == 150_000
    assert truncated
    response.aclose.assert_awaited_once()


@pytest.mark.asyncio
async def test_read_limited_response_body_not_truncated_when_under_cap():
    response = MagicMock(spec=httpx.Response)

    async def aiter_bytes(chunk_size: int = 65536) -> object:
        yield b"hello"

    response.aiter_bytes = aiter_bytes
    response.aclose = AsyncMock()

    body, truncated = await read_limited_response_body(response, 1000)

    assert body == b"hello"
    assert not truncated
    response.aclose.assert_not_awaited()


def test_effective_page_url_uses_response_url():
    response = MagicMock(spec=httpx.Response)
    response.url = httpx.URL("https://www.example.com/shop")
    assert effective_page_url(response) == "https://www.example.com/shop"


@pytest.mark.asyncio
async def test_fetch_uses_redirected_url_for_extraction_and_crawl_origin():
    request_url = "https://example.com/"
    canonical_url = "https://www.example.com/"
    html = (
        '<html><body>'
        '<a href="/products/widget">Widget</a>'
        '<img src="/cdn/hero.png" alt="hero"/>'
        "</body></html>"
    )

    client = _mock_streaming_client(
        [_html_stream_response(url=canonical_url, html=html)]
    )

    validated = ValidatedUrl(
        original="https://example.com",
        normalized=request_url,
        hostname="example.com",
    )

    with patch(
        "services.brand_import.fetcher.brand_import_max_pages",
        return_value=1,
    ), patch(
        "services.brand_import.fetcher.brand_import_http_client",
        return_value=client,
    ):
        result = await fetch_site_pages(validated)

    assert result.site_url == canonical_url
    assert len(result.pages) == 1
    assert result.pages[0].url == canonical_url
    assert any(
        img.url.startswith("https://www.example.com/")
        for img in result.pages[0].image_candidates
    )
    client.stream.assert_called_once_with("GET", request_url)


@pytest.mark.asyncio
async def test_fetch_follows_canonical_host_links_after_redirect():
    request_url = "https://example.com/"
    canonical_url = "https://www.example.com/"
    home_html = '<html><body><a href="https://www.example.com/products/a">A</a></body></html>'
    product_html = "<html><body><h1>Product A</h1></body></html>"

    client = _mock_streaming_client(
        [
            _html_stream_response(url=canonical_url, html=home_html),
            _html_stream_response(
                url="https://www.example.com/products/a",
                html=product_html,
            ),
        ]
    )

    validated = ValidatedUrl(
        original="https://example.com",
        normalized=request_url,
        hostname="example.com",
    )

    with patch(
        "services.brand_import.fetcher.brand_import_max_pages",
        return_value=5,
    ), patch(
        "services.brand_import.fetcher.brand_import_http_client",
        return_value=client,
    ):
        result = await fetch_site_pages(validated)

    assert result.site_url == canonical_url
    assert len(result.pages) == 2
    assert {p.url for p in result.pages} == {
        canonical_url,
        "https://www.example.com/products/a",
    }
    assert client.stream.call_count == 2


@pytest.mark.asyncio
async def test_fetch_truncates_oversized_streamed_body():
    request_url = "https://example.com/"
    huge = b"x" * 5000
    small_html = b"<html><body>ok</body></html>"

    response = MagicMock(spec=httpx.Response)
    response.url = httpx.URL(request_url)
    response.status_code = 200
    response.headers = {"content-type": "text/html"}
    response.encoding = "utf-8"
    response.raise_for_status = MagicMock()

    async def aiter_bytes(chunk_size: int = 65536) -> object:
        yield huge
        yield small_html

    response.aiter_bytes = aiter_bytes
    response.aclose = AsyncMock()

    client = _mock_streaming_client([response])
    validated = ValidatedUrl(
        original=request_url,
        normalized=request_url,
        hostname="example.com",
    )

    with patch(
        "services.brand_import.fetcher.brand_import_max_pages",
        return_value=1,
    ), patch(
        "services.brand_import.fetcher.brand_import_max_bytes_per_page",
        return_value=100,
    ), patch(
        "services.brand_import.fetcher.brand_import_http_client",
        return_value=client,
    ):
        result = await fetch_site_pages(validated)

    assert len(result.pages) == 1
    assert any("Truncated large response" in w for w in result.warnings)
    response.aclose.assert_awaited_once()
