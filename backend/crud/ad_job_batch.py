"""CRUD operations for ad_job_batches table."""

from datetime import datetime, timezone
from typing import Optional
from uuid import UUID

from sqlalchemy import case, select, update
from sqlalchemy.orm import Session

from models.ad_job_batch import AdJobBatch
from schemas.ad_job_batch import AdJobBatchCreate, AdJobBatchUpdate


def get_ad_job_batch(db: Session, batch_id: UUID) -> Optional[AdJobBatch]:
    """Return a single ad job batch by ID, or None."""
    return db.get(AdJobBatch, batch_id)


def get_ad_job_batches(
    db: Session,
    user_id: Optional[UUID] = None,
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
) -> list[AdJobBatch]:
    """Return a list of ad job batches with optional filters."""
    query = select(AdJobBatch)
    if user_id is not None:
        query = query.where(AdJobBatch.user_id == user_id)
    if status is not None:
        query = query.where(AdJobBatch.status == status)
    query = query.order_by(AdJobBatch.created_at.desc()).offset(skip).limit(limit)
    return list(db.scalars(query).all())


def create_ad_job_batch(db: Session, data: AdJobBatchCreate) -> AdJobBatch:
    """Insert a new ad job batch and return it."""
    batch = AdJobBatch(**data.model_dump())
    db.add(batch)
    db.commit()
    db.refresh(batch)
    return batch


def update_ad_job_batch(
    db: Session,
    batch_id: UUID,
    data: AdJobBatchUpdate,
) -> Optional[AdJobBatch]:
    """Update an existing ad job batch. Returns None if not found."""
    batch = db.get(AdJobBatch, batch_id)
    if batch is None:
        return None
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(batch, field, value)
    batch.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(batch)
    return batch


def increment_ad_job_batch_progress(
    db: Session,
    batch_id: UUID,
    *,
    succeeded_delta: int = 0,
    failed_delta: int = 0,
) -> None:
    """Atomically increment succeeded/failed job counts for a batch.

    Also updates `status` to a terminal status once succeeded+failed reaches total_jobs:
    - completed (no failures)
    - completed_with_errors (one or more failures)

    If the batch is already cancelled (canceled_at not null), status is left unchanged.
    """
    if succeeded_delta == 0 and failed_delta == 0:
        return

    now = datetime.now(timezone.utc)

    new_succeeded = AdJobBatch.succeeded_jobs + succeeded_delta
    new_failed = AdJobBatch.failed_jobs + failed_delta
    new_done = new_succeeded + new_failed

    terminal_status = case(
        (new_failed > 0, "completed_with_errors"),
        else_="completed",
    )

    stmt = (
        update(AdJobBatch)
        .where(AdJobBatch.id == batch_id)
        .values(
            succeeded_jobs=new_succeeded,
            failed_jobs=new_failed,
            updated_at=now,
            status=case(
                (AdJobBatch.canceled_at.isnot(None), AdJobBatch.status),
                (new_done >= AdJobBatch.total_jobs, terminal_status),
                else_=AdJobBatch.status,
            ),
        )
    )
    db.execute(stmt)
    db.commit()


def delete_ad_job_batch(db: Session, batch_id: UUID) -> bool:
    """Delete an ad job batch by ID. Returns True if deleted, False if not found."""
    batch = db.get(AdJobBatch, batch_id)
    if batch is None:
        return False
    db.delete(batch)
    db.commit()
    return True
