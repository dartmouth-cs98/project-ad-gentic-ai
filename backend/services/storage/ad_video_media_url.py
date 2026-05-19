"""Append read-only SAS to Azure ``ad-videos`` blob URLs when the account is private."""

from __future__ import annotations

import os
from datetime import datetime, timedelta, timezone
from typing import Optional
from urllib.parse import urlsplit, urlunsplit

from azure.storage.blob import BlobSasPermissions, generate_blob_sas

VIDEO_CONTAINER_NAME = "ad-videos"
# Public Azure Blob host suffix (avoid sovereign-cloud SSRF until explicitly supported).
_AZURE_PUBLIC_BLOB_SUFFIX = ".blob.core.windows.net"
# API responses: short-lived links for browsers.
API_SAS_EXPIRY_HOURS = 1
# Meta publish (download + multipart): allow slow networks / large files.
PUBLISH_SAS_EXPIRY_HOURS = 24


def parse_storage_account_key(conn_str: str) -> tuple[str, str]:
    """Return ``(account_name, account_key)`` from an Azure Storage connection string."""
    parts = dict(part.split("=", 1) for part in conn_str.split(";") if "=" in part)
    return parts["AccountName"], parts["AccountKey"]


def expected_ad_video_blob_hostname() -> Optional[str]:
    """Return ``<account>.blob.core.windows.net`` lowercased when connection string is set."""
    conn_str = os.getenv("AZURE_STORAGE_CONNECTION_STRING", "").strip()
    if not conn_str:
        return None
    try:
        account_name, _ = parse_storage_account_key(conn_str)
    except KeyError:
        return None
    return f"{account_name}{_AZURE_PUBLIC_BLOB_SUFFIX}".lower()


def is_trusted_ad_video_backend_download_url(url: str) -> bool:
    """True only for https URLs to this app's Azure ``ad-videos`` blobs (safe for server-side GET).

    Used to gate the Meta ``advideos`` fallback that downloads ``media_url`` on this server,
    avoiding SSRF via attacker-controlled ``media_url`` values. Requires
    ``AZURE_STORAGE_CONNECTION_STRING`` so the storage account host can be pinned.
    """
    if not (url or "").strip():
        return False
    expected_host = expected_ad_video_blob_hostname()
    if expected_host is None:
        return False
    if extract_ad_video_blob_name(url) is None:
        return False
    try:
        parsed = urlsplit(url.strip())
    except ValueError:
        return False
    if parsed.scheme.lower() != "https":
        return False
    return (parsed.hostname or "").lower() == expected_host


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
