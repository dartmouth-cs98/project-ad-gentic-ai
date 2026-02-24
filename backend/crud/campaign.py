"""CRUD operations for campaigns table."""

from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import select
from sqlalchemy.orm import Session

from models.campaign import Campaign
from schemas.campaign import CampaignCreate, CampaignUpdate


def get_campaigns(
    db: Session,
    business_client_id: int,
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
) -> list[Campaign]:
    """Return campaigns for a specific business client, with optional status filter."""
    query = select(Campaign).where(Campaign.business_client_id == business_client_id)
    if status is not None:
        query = query.where(Campaign.status == status)
    query = query.order_by(Campaign.created_at.desc()).offset(skip).limit(limit)
    return list(db.scalars(query).all())


def get_campaign(db: Session, campaign_id: int) -> Optional[Campaign]:
    """Return a single campaign by ID, or None."""
    return db.get(Campaign, campaign_id)


def create_campaign(db: Session, data: CampaignCreate) -> Campaign:
    """Insert a new campaign and return it."""
    campaign = Campaign(**data.model_dump())
    db.add(campaign)
    db.commit()
    db.refresh(campaign)
    return campaign


def update_campaign(
    db: Session, campaign_id: int, data: CampaignUpdate
) -> Optional[Campaign]:
    """Update an existing campaign. Returns None if not found."""
    campaign = db.get(Campaign, campaign_id)
    if campaign is None:
        return None
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(campaign, field, value)
    campaign.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(campaign)
    return campaign


def delete_campaign(db: Session, campaign_id: int) -> bool:
    """Delete a campaign by ID. Returns True if deleted, False if not found."""
    campaign = db.get(Campaign, campaign_id)
    if campaign is None:
        return False
    db.delete(campaign)
    db.commit()
    return True
