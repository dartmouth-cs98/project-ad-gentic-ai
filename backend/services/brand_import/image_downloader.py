"""Download remote images for product import."""

from __future__ import annotations

import logging
from urllib.parse import urlparse

import httpx

from services.brand_import.config import brand_import_fetch_timeout_seconds, brand_import_user_agent
from services.brand_import.safe_http import (
    brand_import_http_client,
    content_length_exceeds,
    read_limited_response_body,
)
from services.brand_import.url_validation import validate_public_http_url, BrandImportUrlError
from services.storage.product_images import (
    ALLOWED_IMAGE_TYPES,
    MAX_IMAGE_SIZE,
    ProductImageError,
    upload_product_image_bytes,
)

logger = logging.getLogger(__name__)

_GUESS_TYPE = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
    ".gif": "image/gif",
}

_SIZE_LIMIT_MESSAGE = "Remote image exceeds 10 MB limit"


def _content_type_from_response(url: str, headers: dict[str, str], body: bytes) -> str | None:
    ct = (headers.get("content-type") or "").split(";")[0].strip().lower()
    if ct in ALLOWED_IMAGE_TYPES:
        return ct
    path = urlparse(url).path.lower()
    for ext, mime in _GUESS_TYPE.items():
        if path.endswith(ext):
            return mime
    if body[:8] == b"\x89PNG\r\n\x1a\n":
        return "image/png"
    if body[:3] == b"\xff\xd8\xff":
        return "image/jpeg"
    if body[:4] == b"RIFF" and body[8:12] == b"WEBP":
        return "image/webp"
    return None


async def download_and_upload_product_image(image_url: str) -> tuple[str, str]:
    """Validate URL, download image, upload to Azure. Returns (blob_url, blob_name)."""
    try:
        validated = validate_public_http_url(image_url)
    except BrandImportUrlError as exc:
        raise ProductImageError(str(exc)) from exc

    timeout = brand_import_fetch_timeout_seconds()
    headers = {"User-Agent": brand_import_user_agent(), "Accept": "image/*"}

    async with brand_import_http_client(
        timeout=httpx.Timeout(timeout, connect=min(10.0, timeout)),
        headers=headers,
    ) as client:
        async with client.stream("GET", validated.normalized) as response:
            response.raise_for_status()
            response_headers = dict(response.headers)
            final_url = str(response.url)

            if content_length_exceeds(response_headers, MAX_IMAGE_SIZE):
                await response.aclose()
                raise ProductImageError(_SIZE_LIMIT_MESSAGE)

            body, truncated = await read_limited_response_body(response, MAX_IMAGE_SIZE)
            if truncated:
                raise ProductImageError(_SIZE_LIMIT_MESSAGE)

    content_type = _content_type_from_response(final_url, response_headers, body)
    if not content_type:
        raise ProductImageError(f"Unsupported or unknown image type for {image_url}")

    return upload_product_image_bytes(body, content_type)
