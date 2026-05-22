"""CRUD operations for campaign_publications."""

from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import select
from sqlalchemy.orm import Session

from models.campaign_publication import CampaignPublication


def get_publication(
    db: Session, campaign_id: int, external_platform: str
) -> Optional[CampaignPublication]:
    """Return the publication for a given (campaign, platform), or None."""
    stmt = select(CampaignPublication).where(
        CampaignPublication.campaign_id == campaign_id,
        CampaignPublication.external_platform == external_platform,
    )
    return db.scalars(stmt).one_or_none()


def get_publications_for_campaign(
    db: Session, campaign_id: int
) -> list[CampaignPublication]:
    """All publications attached to a campaign, oldest first."""
    stmt = (
        select(CampaignPublication)
        .where(CampaignPublication.campaign_id == campaign_id)
        .order_by(CampaignPublication.created_at)
    )
    return list(db.scalars(stmt).all())


def upsert_publication(
    db: Session,
    *,
    campaign_id: int,
    external_platform: str,
    external_campaign_id: str,
    status: str,
    error_message: Optional[str] = None,
    published_at: Optional[datetime] = None,
) -> CampaignPublication:
    """Insert or update the (campaign x platform) publication row.

    Uses the unique constraint (campaign_id, external_platform) to find an
    existing row. Does not commit - caller commits as part of the broader
    publish transaction so a publish failure leaves nothing partial behind.
    """
    existing = get_publication(db, campaign_id, external_platform)
    now = datetime.now(timezone.utc)

    if existing is None:
        publication = CampaignPublication(
            campaign_id=campaign_id,
            external_platform=external_platform,
            external_campaign_id=external_campaign_id,
            status=status,
            error_message=error_message,
            published_at=published_at or (now if status == "active" else None),
        )
        db.add(publication)
        return publication

    existing.external_campaign_id = external_campaign_id
    existing.status = status
    existing.error_message = error_message
    if status == "active" and existing.published_at is None:
        existing.published_at = published_at or now
    existing.updated_at = now
    return existing
