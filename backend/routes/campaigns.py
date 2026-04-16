"""API routes for campaigns — full CRUD endpoints."""

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from dependencies import get_current_client_id
from schemas.campaign import CampaignCreate, CampaignUpdate, CampaignResponse
from crud.campaign import (
    get_campaigns,
    get_campaign,
    create_campaign,
    update_campaign,
    delete_campaign,
)

router = APIRouter()


@router.get("/", response_model=list[CampaignResponse])
def list_campaigns(
    business_client_id: int,
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """Get all campaigns for a business client, with optional status filter."""
    return get_campaigns(
        db,
        business_client_id=business_client_id,
        skip=skip,
        limit=limit,
        status=status,
    )


@router.get("/{campaign_id}", response_model=CampaignResponse)
def read_campaign(campaign_id: int, db: Session = Depends(get_db)):
    """Get a single campaign by ID."""
    campaign = get_campaign(db, campaign_id)
    if campaign is None:
        raise HTTPException(status_code=404, detail="Campaign not found")
    return campaign


@router.post("/", response_model=CampaignResponse, status_code=201)
def create_new_campaign(data: CampaignCreate, db: Session = Depends(get_db)):
    return create_campaign(db, data)

@router.put("/{campaign_id}", response_model=CampaignResponse)
def update_existing_campaign(
    campaign_id: int, data: CampaignUpdate, db: Session = Depends(get_db)
):
    """Update an existing campaign."""
    campaign = update_campaign(db, campaign_id, data)
    if campaign is None:
        raise HTTPException(status_code=404, detail="Campaign not found")
    return campaign


@router.delete("/{campaign_id}", status_code=204)
def remove_campaign(campaign_id: int, db: Session = Depends(get_db)):
    """Delete a campaign by ID."""
    if not delete_campaign(db, campaign_id):
        raise HTTPException(status_code=404, detail="Campaign not found")


@router.patch("/{campaign_id}/run", response_model=CampaignResponse)
def run_campaign(
    campaign_id: int,
    db: Session = Depends(get_db),
    client_id: int = Depends(get_current_client_id),
):
    """Mark a campaign as active, signalling the agent to begin publishing.
    Only the owning client may trigger this. Currently sets status to 'active';
    agent posting is wired in a subsequent milestone.
    """
    campaign = get_campaign(db, campaign_id)
    if campaign is None:
        raise HTTPException(status_code=404, detail="Campaign not found")
    if campaign.business_client_id != client_id:
        raise HTTPException(status_code=403, detail="Not authorized to run this campaign")
    if campaign.status == "active":
        return campaign  # idempotent

    updated = update_campaign(db, campaign_id, CampaignUpdate(status="active"))
    if updated is None:
        raise HTTPException(status_code=404, detail="Campaign not found")
    return updated
