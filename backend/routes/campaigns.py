"""API routes for campaigns — full CRUD endpoints."""

import logging
from datetime import datetime, timezone
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
from services.meta.campaign_publisher import publish_campaign, MetaPublishError
from services.meta.connection_loader import (
    load_publish_connection,
    ConnectionValidationError,
)
from services.meta.persona_grouping import group_approved_variants_by_persona

router = APIRouter()
logger = logging.getLogger(__name__)


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
    """Publish the campaign's approved variants to Meta and mark it active.

    Flow:
      1. Validate ownership and draft status.
      2. Validate the Instagram social connection (token, ad account, page, IG account).
      3. Group approved variants by their consumer's primary persona.
      4. Call the Meta publisher — creates a Meta Campaign (paused), one Ad Set
         per persona, and one Ad per variant. If we already have a
         ``meta_campaign_id`` from a prior partial attempt, the publisher
         resumes from that campaign instead of creating a duplicate.
      5. Persist the Meta campaign ID and flip status to ``active``.

    On partial failure, the Meta campaign ID is still saved so a subsequent
    retry can pick up where it left off — the Meta entities themselves stay
    PAUSED, so the client can clean up in Meta Ads Manager if needed.
    """
    campaign = get_campaign(db, campaign_id)
    if campaign is None:
        raise HTTPException(status_code=404, detail="Campaign not found")
    if campaign.business_client_id != client_id:
        raise HTTPException(status_code=403, detail="Not authorized to run this campaign")
    if campaign.status == "active":
        return campaign  # idempotent

    try:
        connection = load_publish_connection(db, client_id)
    except ConnectionValidationError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    persona_groups = group_approved_variants_by_persona(db, campaign_id)
    if not persona_groups:
        raise HTTPException(
            status_code=400,
            detail="No approved ad variants to publish. Approve at least one variant first.",
        )

    try:
        meta_campaign_id = publish_campaign(
            campaign_name=campaign.name,
            goal=campaign.goal,
            budget_total=float(campaign.budget_total) if campaign.budget_total is not None else None,
            start_date=campaign.start_date,
            end_date=campaign.end_date,
            persona_groups=persona_groups,
            encrypted_token=connection.encrypted_token,
            ad_account_id=connection.ad_account_id,
            instagram_account_id=connection.instagram_account_id,
            facebook_page_id=connection.facebook_page_id,
            existing_meta_campaign_id=campaign.meta_campaign_id,
        )
    except MetaPublishError as exc:
        # Persist partial state so a retry can resume without creating duplicates.
        if exc.meta_campaign_id and not campaign.meta_campaign_id:
            campaign.meta_campaign_id = exc.meta_campaign_id
            campaign.updated_at = datetime.now(timezone.utc)
            db.commit()
        logger.exception(
            "Meta publish failed for campaign %d (partial meta_campaign_id=%s)",
            campaign_id, exc.meta_campaign_id,
        )
        raise HTTPException(
            status_code=502,
            detail=(
                "We couldn't publish this campaign to Meta right now. "
                "We've saved your progress — click Run Campaign again to retry. "
                "If it keeps failing, check Settings → Integrations or contact support."
            ),
        )

    campaign.meta_campaign_id = meta_campaign_id
    campaign.status = "active"
    campaign.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(campaign)
    return campaign
