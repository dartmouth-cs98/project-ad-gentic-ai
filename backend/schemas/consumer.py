"""Pydantic schemas for consumers — request/response validation."""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel


# ---------- Request schemas ----------

class ConsumerCreate(BaseModel):
    """Schema for creating a new consumer. All fields are required."""
    email: str
    phone: str
    first_name: str
    last_name: str
    traits: dict


# ---------- Response schemas ----------

class ConsumerCsvUploadResponse(BaseModel):
    """Summary returned after a CSV upload."""
    created: int
    skipped: int
    skipped_emails: list[str]
    errors: list[str]


class ConsumerResponse(BaseModel):
    """Schema returned to the frontend."""
    id: int
    email: Optional[str] = None
    phone: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    traits: Optional[dict] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
