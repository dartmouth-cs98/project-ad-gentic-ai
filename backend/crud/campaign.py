"""CRUD operations for campaigns table."""

import time
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import delete as sa_delete, select
from sqlalchemy.exc import DBAPIError, IntegrityError
from sqlalchemy.orm import Session, selectinload

from models.ad_variant import AdVariant
from models.campaign import Campaign
from models.campaign_metric import CampaignMetric
from models.campaign_publication import CampaignPublication
from models.chat_message import ChatMessage
from models.consumer_event import ConsumerEvent
from schemas.campaign import CampaignCreate, CampaignUpdate

_MAX_DEADLOCK_RETRIES = 3


class CampaignDeleteConflict(Exception):
    """Raised when campaign delete fails due to remaining FK references."""


def _is_deadlock(exc: BaseException) -> bool:
    """True for SQL Server deadlock victim (error 1205 / 40001)."""
    if not isinstance(exc, DBAPIError):
        return False
    orig = exc.orig
    if orig is None:
        return "1205" in str(exc)
    args = getattr(orig, "args", ())
    if args and args[0] == "40001":
        return True
    return "1205" in str(orig)


def _cascade_delete_campaign_ids(db: Session, campaign_ids: list[int]) -> None:
    """Delete dependent rows then campaign rows for the given IDs (no commit)."""
    if not campaign_ids:
        return

    variant_ids_subq = select(AdVariant.id).where(AdVariant.campaign_id.in_(campaign_ids))

    db.execute(
        sa_delete(ConsumerEvent).where(
            ConsumerEvent.ad_variant_id.in_(variant_ids_subq)
        )
    )
    db.execute(sa_delete(AdVariant).where(AdVariant.campaign_id.in_(campaign_ids)))
    db.execute(
        sa_delete(CampaignMetric).where(CampaignMetric.campaign_id.in_(campaign_ids))
    )
    db.execute(
        sa_delete(CampaignPublication).where(
            CampaignPublication.campaign_id.in_(campaign_ids)
        )
    )
    db.execute(sa_delete(ChatMessage).where(ChatMessage.campaign_id.in_(campaign_ids)))
    db.execute(sa_delete(Campaign).where(Campaign.id.in_(campaign_ids)))


def _commit_cascade_delete(db: Session, campaign_ids: list[int]) -> None:
    """Run cascade deletes and commit, retrying on SQL Server deadlock."""
    last_error: Optional[BaseException] = None
    for attempt in range(_MAX_DEADLOCK_RETRIES):
        try:
            _cascade_delete_campaign_ids(db, campaign_ids)
            db.commit()
            return
        except IntegrityError as exc:
            db.rollback()
            raise CampaignDeleteConflict(
                "Campaign cannot be deleted because related data still exists."
            ) from exc
        except DBAPIError as exc:
            db.rollback()
            last_error = exc
            if _is_deadlock(exc) and attempt < _MAX_DEADLOCK_RETRIES - 1:
                time.sleep(0.05 * (attempt + 1))
                continue
            raise
    if last_error is not None:
        raise last_error


def get_campaigns(
    db: Session,
    business_client_id: int,
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
) -> list[Campaign]:
    """Return campaigns for a specific business client, with optional status filter."""
    query = (
        select(Campaign)
        .where(Campaign.business_client_id == business_client_id)
        .options(selectinload(Campaign.publications))
    )
    if status is not None:
        query = query.where(Campaign.status == status)
    query = query.order_by(Campaign.created_at.desc()).offset(skip).limit(limit)
    return list(db.scalars(query).all())


def get_campaign(db: Session, campaign_id: int) -> Optional[Campaign]:
    """Return a single campaign by ID with its publications eager-loaded, or None."""
    stmt = (
        select(Campaign)
        .options(selectinload(Campaign.publications))
        .where(Campaign.id == campaign_id)
    )
    return db.scalars(stmt).one_or_none()


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
    """Delete a campaign and dependent rows in one transaction.

    Returns True if deleted, False if not found.
    Raises CampaignDeleteConflict if a FK still blocks delete after cascade.
    """
    if db.get(Campaign, campaign_id) is None:
        return False
    _commit_cascade_delete(db, [campaign_id])
    return True


def delete_campaigns_bulk(
    db: Session, campaign_ids: list[int]
) -> tuple[list[int], list[int]]:
    """Delete multiple campaigns in one transaction.

    Returns (deleted_ids, not_found_ids). Deduplicates ``campaign_ids`` while
    preserving first-seen order. Raises CampaignDeleteConflict on FK failure.
    """
    unique_ids = list(dict.fromkeys(campaign_ids))
    if not unique_ids:
        return [], []

    found = list(
        db.scalars(select(Campaign.id).where(Campaign.id.in_(unique_ids))).all()
    )
    found_set = set(found)
    not_found = [cid for cid in unique_ids if cid not in found_set]

    if found:
        _commit_cascade_delete(db, found)

    return found, not_found
