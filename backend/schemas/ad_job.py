"""Pydantic schemas for ad_jobs — request/response validation."""

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field


# ---------- Request schemas ----------


class AdJobCreate(BaseModel):
    """Schema for creating a new ad job."""
    batch_id: UUID
    status: str = Field(..., max_length=20)
    input_json: str
    attempt_count: int = 0


class AdJobUpdate(BaseModel):
    """Schema for updating an ad job. All fields optional."""
    status: Optional[str] = Field(None, max_length=20)
    output_json: Optional[str] = None
    error_message: Optional[str] = None
    attempt_count: Optional[int] = None
    locked_at: Optional[datetime] = None
    locked_by: Optional[str] = Field(None, max_length=100)


# ---------- Response schema ----------


class AdJobResponse(BaseModel):
    """Schema returned to the frontend."""
    id: UUID
    batch_id: UUID
    status: str
    input_json: str
    output_json: Optional[str] = None
    error_message: Optional[str] = None
    attempt_count: int
    locked_at: Optional[datetime] = None
    locked_by: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
