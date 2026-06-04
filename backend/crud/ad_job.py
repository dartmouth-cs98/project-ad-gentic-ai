"""CRUD operations for ad_jobs table."""

from datetime import datetime, timezone
from typing import Optional
from uuid import UUID

from sqlalchemy import select, update
from sqlalchemy.orm import Session

from models.ad_job import AdJob
from schemas.ad_job import AdJobCreate, AdJobUpdate


def get_ad_job(db: Session, ad_job_id: UUID) -> Optional[AdJob]:
    """Return a single ad job by ID, or None."""
    return db.get(AdJob, ad_job_id)


def get_ad_jobs(
    db: Session,
    batch_id: Optional[UUID] = None,
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
) -> list[AdJob]:
    """Return a list of ad jobs with optional filters."""
    query = select(AdJob)
    if batch_id is not None:
        query = query.where(AdJob.batch_id == batch_id)
    if status is not None:
        query = query.where(AdJob.status == status)
    query = query.order_by(AdJob.created_at.desc()).offset(skip).limit(limit)
    return list(db.scalars(query).all())


def get_pending_ad_jobs(
    db: Session,
    *,
    limit: int = 1,
    max_attempts: int = 3,
    status: str = "pending",
) -> list[AdJob]:
    """Return ad jobs that are pending, unlocked, and under the attempt limit.
    Used by the poller to find work. Ordered by created_at ascending (FIFO).
    """
    query = (
        select(AdJob)
        .where(AdJob.status == status)
        .where(AdJob.locked_at.is_(None))
        .where(AdJob.attempt_count < max_attempts)
        .order_by(AdJob.created_at.asc())
        .limit(limit)
    )
    return list(db.scalars(query).all())


def claim_ad_job(
    db: Session,
    ad_job_id: UUID,
    worker_id: str,
    *,
    status_while_running: str = "running",
) -> bool:
    """Atomically claim a job by setting locked_at and locked_by only if it is still unclaimed.
    Returns True if this worker claimed the job, False if someone else did or it was already processed.
    """
    now = datetime.now(timezone.utc)
    stmt = (
        update(AdJob)
        .where(AdJob.id == ad_job_id)
        .where(AdJob.locked_at.is_(None))
        .where(AdJob.status == "pending")
        .values(
            locked_at=now,
            locked_by=worker_id,
            status=status_while_running,
            attempt_count=AdJob.attempt_count + 1,
            updated_at=now,
        )
    )
    result = db.execute(stmt)
    db.commit()
    return result.rowcount > 0


def release_job_lock(
    db: Session,
    ad_job_id: UUID,
    *,
    status: str = "pending",
    worker_id: Optional[str] = None,
) -> None:
    """Clear lock on a job (e.g. after failure so another worker can retry).
    If worker_id is set, only clears the lock when locked_by equals worker_id.
    """
    stmt = update(AdJob).where(AdJob.id == ad_job_id)
    if worker_id is not None:
        stmt = stmt.where(AdJob.locked_by == worker_id)
    stmt = stmt.values(
        locked_at=None, locked_by=None, status=status, updated_at=datetime.now(timezone.utc)
    )
    db.execute(stmt)
    db.commit()


def create_ad_job(db: Session, data: AdJobCreate) -> AdJob:
    """Insert a new ad job and return it."""
    ad_job = AdJob(**data.model_dump())
    db.add(ad_job)
    db.commit()
    db.refresh(ad_job)
    return ad_job


def update_ad_job(
    db: Session,
    ad_job_id: UUID,
    data: AdJobUpdate,
) -> Optional[AdJob]:
    """Update an existing ad job. Returns None if not found."""
    ad_job = db.get(AdJob, ad_job_id)
    if ad_job is None:
        return None
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(ad_job, field, value)
    ad_job.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(ad_job)
    return ad_job


def delete_ad_job(db: Session, ad_job_id: UUID) -> bool:
    """Delete an ad job by ID. Returns True if deleted, False if not found."""
    ad_job = db.get(AdJob, ad_job_id)
    if ad_job is None:
        return False
    db.delete(ad_job)
    db.commit()
    return True
