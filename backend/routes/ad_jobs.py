"""API routes for ad_jobs — full CRUD endpoints."""

from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from schemas.ad_job import AdJobCreate, AdJobUpdate, AdJobResponse
from crud.ad_job import (
    get_ad_job,
    get_ad_jobs,
    create_ad_job,
    update_ad_job,
    delete_ad_job,
)

router = APIRouter()


@router.get("/", response_model=list[AdJobResponse])
def list_ad_jobs(
    skip: int = 0,
    limit: int = 100,
    batch_id: Optional[UUID] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """Get all ad jobs, with optional filtering by batch_id or status."""
    return get_ad_jobs(db, batch_id=batch_id, status=status, skip=skip, limit=limit)


@router.get("/{ad_job_id}", response_model=AdJobResponse)
def read_ad_job(ad_job_id: UUID, db: Session = Depends(get_db)):
    """Get a single ad job by ID."""
    ad_job = get_ad_job(db, ad_job_id)
    if ad_job is None:
        raise HTTPException(status_code=404, detail="Ad job not found")
    return ad_job


@router.post("/", response_model=AdJobResponse, status_code=201)
def create_new_ad_job(data: AdJobCreate, db: Session = Depends(get_db)):
    """Create a new ad job."""
    return create_ad_job(db, data)


@router.put("/{ad_job_id}", response_model=AdJobResponse)
def update_existing_ad_job(
    ad_job_id: UUID,
    data: AdJobUpdate,
    db: Session = Depends(get_db),
):
    """Update an existing ad job."""
    ad_job = update_ad_job(db, ad_job_id, data)
    if ad_job is None:
        raise HTTPException(status_code=404, detail="Ad job not found")
    return ad_job


@router.delete("/{ad_job_id}", status_code=204)
def remove_ad_job(ad_job_id: UUID, db: Session = Depends(get_db)):
    """Delete an ad job by ID."""
    if not delete_ad_job(db, ad_job_id):
        raise HTTPException(status_code=404, detail="Ad job not found")
