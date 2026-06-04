"""API routes for ad_job_batches — full CRUD endpoints."""

from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from schemas.ad_job_batch import AdJobBatchCreate, AdJobBatchUpdate, AdJobBatchResponse
from crud.ad_job_batch import (
    get_ad_job_batch,
    get_ad_job_batches,
    create_ad_job_batch,
    update_ad_job_batch,
    delete_ad_job_batch,
)

router = APIRouter()


@router.get("/", response_model=list[AdJobBatchResponse])
def list_ad_job_batches(
    skip: int = 0,
    limit: int = 100,
    user_id: Optional[UUID] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """Get all ad job batches, with optional filtering by user_id or status."""
    return get_ad_job_batches(db, user_id=user_id, status=status, skip=skip, limit=limit)


@router.get("/{batch_id}", response_model=AdJobBatchResponse)
def read_ad_job_batch(batch_id: UUID, db: Session = Depends(get_db)):
    """Get a single ad job batch by ID."""
    batch = get_ad_job_batch(db, batch_id)
    if batch is None:
        raise HTTPException(status_code=404, detail="Ad job batch not found")
    return batch


@router.post("/", response_model=AdJobBatchResponse, status_code=201)
def create_new_ad_job_batch(data: AdJobBatchCreate, db: Session = Depends(get_db)):
    """Create a new ad job batch."""
    return create_ad_job_batch(db, data)


@router.put("/{batch_id}", response_model=AdJobBatchResponse)
def update_existing_ad_job_batch(
    batch_id: UUID,
    data: AdJobBatchUpdate,
    db: Session = Depends(get_db),
):
    """Update an existing ad job batch."""
    batch = update_ad_job_batch(db, batch_id, data)
    if batch is None:
        raise HTTPException(status_code=404, detail="Ad job batch not found")
    return batch


@router.delete("/{batch_id}", status_code=204)
def remove_ad_job_batch(batch_id: UUID, db: Session = Depends(get_db)):
    """Delete an ad job batch by ID."""
    if not delete_ad_job_batch(db, batch_id):
        raise HTTPException(status_code=404, detail="Ad job batch not found")
