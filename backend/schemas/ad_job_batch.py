"""Pydantic schemas for ad_job_batches — request/response validation."""

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field




class AdJobBatchCreate(BaseModel):
    """Schema for creating a new ad job batch."""
    user_id: UUID
    status: str = Field(..., max_length=20)
    total_jobs: int
    succeeded_jobs: int = 0
    failed_jobs: int = 0
    idempotency_key: Optional[str] = Field(None, max_length=255)


class AdJobBatchUpdate(BaseModel):
    """Schema for updating an ad job batch. All fields optional."""
    status: Optional[str] = Field(None, max_length=20)
    total_jobs: Optional[int] = None
    succeeded_jobs: Optional[int] = None
    failed_jobs: Optional[int] = None
    idempotency_key: Optional[str] = Field(None, max_length=255)
    canceled_at: Optional[datetime] = None


# ---------- Response schema ----------


class AdJobBatchResponse(BaseModel):
    """Schema returned to the frontend."""
    id: UUID
    user_id: UUID
    status: str
    total_jobs: int
    succeeded_jobs: int
    failed_jobs: int
    idempotency_key: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    canceled_at: Optional[datetime] = None

    model_config = {"from_attributes": True}
