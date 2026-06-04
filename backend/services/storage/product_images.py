"""Azure Blob helpers for product images (shared by routes and brand import)."""

from __future__ import annotations

import json
import os
import uuid
from typing import Optional

from azure.storage.blob import BlobClient, ContainerClient, ContentSettings

CONTAINER_NAME = "product-images"
MAX_IMAGES_PER_PRODUCT = 5

ALLOWED_IMAGE_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
}
MAX_IMAGE_SIZE = 10 * 1024 * 1024  # 10 MB


class ProductImageError(ValueError):
    """Invalid image bytes or storage misconfiguration."""


def storage_connection_string() -> str:
    conn = os.getenv("AZURE_STORAGE_CONNECTION_STRING", "").strip()
    if not conn:
        raise ProductImageError("AZURE_STORAGE_CONNECTION_STRING is not configured")
    return conn


def ensure_product_images_container(conn_str: str) -> ContainerClient:
    container = ContainerClient.from_connection_string(
        conn_str=conn_str,
        container_name=CONTAINER_NAME,
    )
    if not container.exists():
        container.create_container()
    return container


def upload_product_image_bytes(image_bytes: bytes, content_type: str) -> tuple[str, str]:
    """Upload image bytes; return (blob_url, blob_name)."""
    if content_type not in ALLOWED_IMAGE_TYPES:
        raise ProductImageError(
            f"Unsupported image type {content_type!r}. Allowed: {', '.join(ALLOWED_IMAGE_TYPES)}"
        )
    if len(image_bytes) > MAX_IMAGE_SIZE:
        raise ProductImageError("Image exceeds 10 MB limit")
    if not image_bytes:
        raise ProductImageError("Empty image")

    conn_str = storage_connection_string()
    ensure_product_images_container(conn_str)
    ext = ALLOWED_IMAGE_TYPES[content_type]
    blob_name = f"{uuid.uuid4().hex}{ext}"
    blob_client = BlobClient.from_connection_string(
        conn_str=conn_str,
        container_name=CONTAINER_NAME,
        blob_name=blob_name,
    )
    blob_client.upload_blob(
        image_bytes,
        overwrite=True,
        content_settings=ContentSettings(content_type=content_type),
    )
    return blob_client.url, blob_name


def append_images_to_product_lists(
    existing_urls: list[str],
    existing_names: list[str],
    new_urls: list[str],
    new_names: list[str],
) -> tuple[Optional[str], Optional[str]]:
    """Return JSON-encoded image_url / image_name column values."""
    urls = existing_urls + new_urls
    names = existing_names + new_names
    if not urls:
        return None, None
    return json.dumps(urls), json.dumps(names)
