"""API routes for ad_variants — full CRUD endpoints."""

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from dependencies import get_current_client_id
from models.campaign import Campaign
from schemas.ad_variant import AdVariantCreate, AdVariantUpdate, AdVariantResponse
from crud.ad_variant import (
    get_ad_variants,
    get_ad_variant,
    create_ad_variant,
    update_ad_variant,
    delete_ad_variant,
)
from services.storage.ad_video_media_url import API_SAS_EXPIRY_HOURS, signed_ad_video_media_url

router = APIRouter()


def _sign_ad_variant(ad_variant) -> AdVariantResponse:
    """Convert ORM ad variant to response with optional time-limited SAS on media_url."""
    resp = AdVariantResponse.model_validate(ad_variant, from_attributes=True)
    if not resp.media_url:
        return resp
    resp.media_url = signed_ad_video_media_url(
        resp.media_url,
        expiry_hours=API_SAS_EXPIRY_HOURS,
    )
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


@router.patch("/{ad_variant_id}/approve", response_model=AdVariantResponse)
def approve_ad_variant(
    ad_variant_id: int,
    db: Session = Depends(get_db),
    client_id: int = Depends(get_current_client_id),
):
    """Mark an ad variant as approved. Only the owning client may approve."""
    ad_variant = get_ad_variant(db, ad_variant_id)
    if ad_variant is None:
        raise HTTPException(status_code=404, detail="Ad variant not found")

    campaign = db.get(Campaign, ad_variant.campaign_id)
    if campaign is None or campaign.business_client_id != client_id:
        raise HTTPException(status_code=403, detail="Not authorised to approve this variant")

    updated = update_ad_variant(db, ad_variant_id, AdVariantUpdate(is_approved=True))
    return _sign_ad_variant(updated)


@router.patch("/{ad_variant_id}/unapprove", response_model=AdVariantResponse)
def unapprove_ad_variant(
    ad_variant_id: int,
    db: Session = Depends(get_db),
    client_id: int = Depends(get_current_client_id),
):
    """Revoke approval on an ad variant."""
    ad_variant = get_ad_variant(db, ad_variant_id)
    if ad_variant is None:
        raise HTTPException(status_code=404, detail="Ad variant not found")

    campaign = db.get(Campaign, ad_variant.campaign_id)
    if campaign is None or campaign.business_client_id != client_id:
        raise HTTPException(status_code=403, detail="Not authorised to modify this variant")

    updated = update_ad_variant(db, ad_variant_id, AdVariantUpdate(is_approved=False))
    return _sign_ad_variant(updated)
