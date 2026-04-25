"""Append read-only SAS to Azure ``ad-videos`` blob URLs when the account is private."""

from __future__ import annotations

import os
from datetime import datetime, timedelta, timezone
from typing import Optional
from urllib.parse import urlsplit, urlunsplit

from azure.storage.blob import BlobSasPermissions, generate_blob_sas

VIDEO_CONTAINER_NAME = "ad-videos"
# API responses: short-lived links for browsers.
API_SAS_EXPIRY_HOURS = 1
# Meta publish (download + multipart): allow slow networks / large files.
PUBLISH_SAS_EXPIRY_HOURS = 24


def parse_storage_account_key(conn_str: str) -> tuple[str, str]:
    """Return ``(account_name, account_key)`` from an Azure Storage connection string."""
    parts = dict(part.split("=", 1) for part in conn_str.split(";") if "=" in part)
    return parts["AccountName"], parts["AccountKey"]


def extract_ad_video_blob_name(media_url: str) -> Optional[str]:
    """Return blob path within ``ad-videos`` or ``None`` if URL is not that container."""
    try:
        parsed = urlsplit(media_url)
        if not parsed.scheme or not parsed.netloc:
            return None
        if ".blob.core.windows.net" not in parsed.netloc:
            return None
        path = parsed.path.lstrip("/")
        if not path:
            return None
        container, sep, blob_name = path.partition("/")
        if sep == "" or container != VIDEO_CONTAINER_NAME or not blob_name:
            return None
        return blob_name
    except ValueError:
        return None


def append_query(url: str, query_fragment: str) -> str:
    """Append a query fragment while preserving existing query params."""
    parsed = urlsplit(url)
    merged_query = f"{parsed.query}&{query_fragment}" if parsed.query else query_fragment
    return urlunsplit((parsed.scheme, parsed.netloc, parsed.path, merged_query, parsed.fragment))


def _already_has_sas_signature(media_url: str) -> bool:
    q = urlsplit(media_url).query.lower()
    return "sig=" in q


def signed_ad_video_media_url(
    media_url: str,
    *,
    expiry_hours: int = API_SAS_EXPIRY_HOURS,
) -> str:
    """Return ``media_url`` with read SAS if it is our Azure ad-videos blob and lacks ``sig``."""
    if not (media_url or "").strip():
        return media_url
    if _already_has_sas_signature(media_url):
        return media_url
    conn_str = os.getenv("AZURE_STORAGE_CONNECTION_STRING", "").strip()
    if not conn_str:
        return media_url
    blob_name = extract_ad_video_blob_name(media_url)
    if not blob_name:
        return media_url
    account_name, account_key = parse_storage_account_key(conn_str)
    sas_token = generate_blob_sas(
        account_name=account_name,
        container_name=VIDEO_CONTAINER_NAME,
        blob_name=blob_name,
        account_key=account_key,
        permission=BlobSasPermissions(read=True),
        expiry=datetime.now(timezone.utc) + timedelta(hours=expiry_hours),
    )
    return append_query(media_url, sas_token)
