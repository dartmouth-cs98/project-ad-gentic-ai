"""API routes for ad_variants — full CRUD endpoints."""

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

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


@router.get("/", response_model=list[AdVariantResponse])
def list_ad_variants(
    skip: int = 0,
    limit: int = 100,
    campaign_id: Optional[int] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """Get all ad variants, with optional filtering by campaign_id or status."""
    return get_ad_variants(db, skip=skip, limit=limit, campaign_id=campaign_id, status=status)


@router.get("/{ad_variant_id}", response_model=AdVariantResponse)
def read_ad_variant(ad_variant_id: int, db: Session = Depends(get_db)):
    """Get a single ad variant by ID."""
    ad_variant = get_ad_variant(db, ad_variant_id)
    if ad_variant is None:
        raise HTTPException(status_code=404, detail="Ad variant not found")
    return ad_variant


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
