"""Image downloads enforce size limits while streaming."""

from __future__ import annotations

import ipaddress
from unittest.mock import AsyncMock, MagicMock, patch

import httpx
import pytest

from services.brand_import.image_downloader import download_and_upload_product_image
from services.brand_import.safe_http import content_length_exceeds, read_limited_response_body
from services.storage.product_images import MAX_IMAGE_SIZE, ProductImageError


class _StreamContext:
    def __init__(self, response: MagicMock) -> None:
        self._response = response

    async def __aenter__(self) -> MagicMock:
        return self._response

    async def __aexit__(self, *args: object) -> bool:
        return False


def _public_ip_patch():
    return patch(
        "services.brand_import.url_validation._resolve_hostname_ips",
        return_value=[ipaddress.ip_address("93.184.216.34")],
    )


def test_content_length_exceeds():
    assert content_length_exceeds({"content-length": str(MAX_IMAGE_SIZE + 1)}, MAX_IMAGE_SIZE)
    assert not content_length_exceeds({"content-length": str(MAX_IMAGE_SIZE)}, MAX_IMAGE_SIZE)
    assert not content_length_exceeds({}, MAX_IMAGE_SIZE)


@pytest.mark.asyncio
async def test_read_limited_response_body_stops_before_oversized_download():
    chunks = [b"x" * 100_000, b"y" * 100_000]

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
async def test_download_rejects_content_length_over_limit():
    png_header = b"\x89PNG\r\n\x1a\n" + b"x" * 100
    response = MagicMock(spec=httpx.Response)
    response.url = httpx.URL("https://cdn.example.com/big.png")
    response.status_code = 200
    response.headers = {
        "content-type": "image/png",
        "content-length": str(MAX_IMAGE_SIZE + 1),
    }
    response.raise_for_status = MagicMock()

    async def aiter_bytes(chunk_size: int = 65536) -> object:
        yield png_header

    response.aiter_bytes = aiter_bytes
    response.aclose = AsyncMock()

    client = AsyncMock()
    client.stream = MagicMock(return_value=_StreamContext(response))
    client.__aenter__ = AsyncMock(return_value=client)
    client.__aexit__ = AsyncMock(return_value=None)

    with _public_ip_patch(), patch(
        "services.brand_import.image_downloader.brand_import_http_client",
        return_value=client,
    ), patch(
        "services.brand_import.image_downloader.upload_product_image_bytes",
    ) as mock_upload:
        with pytest.raises(ProductImageError, match="10 MB"):
            await download_and_upload_product_image("https://cdn.example.com/big.png")

    response.aclose.assert_awaited_once()
    mock_upload.assert_not_called()


@pytest.mark.asyncio
async def test_download_rejects_streamed_body_over_limit():
    response = MagicMock(spec=httpx.Response)
    response.url = httpx.URL("https://cdn.example.com/big.png")
    response.status_code = 200
    response.headers = {"content-type": "image/png"}
    response.raise_for_status = MagicMock()

    async def aiter_bytes(chunk_size: int = 65536) -> object:
        yield b"x" * (MAX_IMAGE_SIZE + 1)

    response.aiter_bytes = aiter_bytes
    response.aclose = AsyncMock()

    client = AsyncMock()
    client.stream = MagicMock(return_value=_StreamContext(response))
    client.__aenter__ = AsyncMock(return_value=client)
    client.__aexit__ = AsyncMock(return_value=None)

    with _public_ip_patch(), patch(
        "services.brand_import.image_downloader.brand_import_http_client",
        return_value=client,
    ), patch(
        "services.brand_import.image_downloader.upload_product_image_bytes",
    ) as mock_upload:
        with pytest.raises(ProductImageError, match="10 MB"):
            await download_and_upload_product_image("https://cdn.example.com/big.png")

    response.aclose.assert_awaited_once()
    mock_upload.assert_not_called()


@pytest.mark.asyncio
async def test_download_uploads_valid_streamed_image():
    png_body = b"\x89PNG\r\n\x1a\n" + b"small-image-bytes"

    response = MagicMock(spec=httpx.Response)
    response.url = httpx.URL("https://cdn.example.com/ok.png")
    response.status_code = 200
    response.headers = {"content-type": "image/png", "content-length": str(len(png_body))}
    response.raise_for_status = MagicMock()

    async def aiter_bytes(chunk_size: int = 65536) -> object:
        yield png_body

    response.aiter_bytes = aiter_bytes
    response.aclose = AsyncMock()

    client = AsyncMock()
    client.stream = MagicMock(return_value=_StreamContext(response))
    client.__aenter__ = AsyncMock(return_value=client)
    client.__aexit__ = AsyncMock(return_value=None)

    with _public_ip_patch(), patch(
        "services.brand_import.image_downloader.brand_import_http_client",
        return_value=client,
    ), patch(
        "services.brand_import.image_downloader.upload_product_image_bytes",
        return_value=("https://blob/ok.png", "ok.png"),
    ) as mock_upload:
        blob_url, blob_name = await download_and_upload_product_image("https://cdn.example.com/ok.png")

    assert blob_url == "https://blob/ok.png"
    assert blob_name == "ok.png"
    mock_upload.assert_called_once_with(png_body, "image/png")
    response.aclose.assert_not_awaited()
