"""API routes for ad_variants — full CRUD endpoints."""

import os
from datetime import datetime, timedelta, timezone
from typing import Optional
from urllib.parse import urlsplit, urlunsplit

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from azure.storage.blob import BlobSasPermissions, generate_blob_sas

from database import get_db
from schemas.ad_variant import AdVariantCreate, AdVariantUpdate, AdVariantResponse
from crud.ad_variant import (
    get_ad_variants,
    get_ad_variant,
    create_ad_variant,
    update_ad_variant,
    delete_ad_variant,
)

router = APIRouter()
SAS_EXPIRY_HOURS = 1
VIDEO_CONTAINER_NAME = "ad-videos"


def _parse_conn_str(conn_str: str) -> tuple[str, str]:
    """Extract account_name and account_key from an Azure Storage connection string."""
    parts = dict(part.split("=", 1) for part in conn_str.split(";") if "=" in part)
    return parts["AccountName"], parts["AccountKey"]


def _extract_blob_name(media_url: str) -> Optional[str]:
    """Extract blob path from a media URL when it points to the ad-videos container."""
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


def _append_query(url: str, query_fragment: str) -> str:
    """Append a query fragment while preserving existing query params."""
    parsed = urlsplit(url)
    merged_query = f"{parsed.query}&{query_fragment}" if parsed.query else query_fragment
    return urlunsplit((parsed.scheme, parsed.netloc, parsed.path, merged_query, parsed.fragment))


def _sign_ad_variant(ad_variant) -> AdVariantResponse:
    """Convert ORM ad variant to response with optional time-limited SAS on media_url."""
    resp = AdVariantResponse.model_validate(ad_variant, from_attributes=True)
    if not resp.media_url:
        return resp

    conn_str = os.getenv("AZURE_STORAGE_CONNECTION_STRING", "").strip()
    if not conn_str:
        return resp

    blob_name = _extract_blob_name(resp.media_url)
    if not blob_name:
        return resp

    account_name, account_key = _parse_conn_str(conn_str)
    sas_token = generate_blob_sas(
        account_name=account_name,
        container_name=VIDEO_CONTAINER_NAME,
        blob_name=blob_name,
        account_key=account_key,
        permission=BlobSasPermissions(read=True),
        expiry=datetime.now(timezone.utc) + timedelta(hours=SAS_EXPIRY_HOURS),
    )
    resp.media_url = _append_query(resp.media_url, sas_token)
    return resp


@router.get("/", response_model=list[AdVariantResponse])
def list_ad_variants(
    skip: int = 0,
    limit: int = 100,
    campaign_id: Optional[int] = None,
    status: Optional[str] = None,
    is_preview: Optional[bool] = None,
    db: Session = Depends(get_db),
):
    """Get all ad variants, with optional filtering by campaign_id, status, or is_preview."""
    variants = get_ad_variants(
        db,
        skip=skip,
        limit=limit,
        campaign_id=campaign_id,
        status=status,
        is_preview=is_preview,
    )
    return [_sign_ad_variant(v) for v in variants]


@router.get("/{ad_variant_id}", response_model=AdVariantResponse)
def read_ad_variant(ad_variant_id: int, db: Session = Depends(get_db)):
    """Get a single ad variant by ID."""
    ad_variant = get_ad_variant(db, ad_variant_id)
    if ad_variant is None:
        raise HTTPException(status_code=404, detail="Ad variant not found")
    return _sign_ad_variant(ad_variant)


@router.post("/", response_model=AdVariantResponse, status_code=201)
def create_new_ad_variant(data: AdVariantCreate, db: Session = Depends(get_db)):
    """Create a new ad variant."""
    return create_ad_variant(db, data)


@router.put("/{ad_variant_id}", response_model=AdVariantResponse)
def update_existing_ad_variant(
    ad_variant_id: int, data: AdVariantUpdate, db: Session = Depends(get_db)
):
    """Update an existing ad variant."""
    ad_variant = update_ad_variant(db, ad_variant_id, data)
    if ad_variant is None:
        raise HTTPException(status_code=404, detail="Ad variant not found")
    return ad_variant


@router.delete("/{ad_variant_id}", status_code=204)
def remove_ad_variant(ad_variant_id: int, db: Session = Depends(get_db)):
    """Delete an ad variant by ID."""
    if not delete_ad_variant(db, ad_variant_id):
        raise HTTPException(status_code=404, detail="Ad variant not found")
