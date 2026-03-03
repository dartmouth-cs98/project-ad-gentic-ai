"""Pydantic schemas for consumers — request/response validation."""

from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel

from schemas.persona import PersonaBrief


# ---------- Request schemas ----------

class ConsumerCreate(BaseModel):
    """Schema for creating a new consumer. All fields are required."""
    email: str
    phone: str
    first_name: str
    last_name: str
    traits: dict


class AssignPersonasRequest(BaseModel):
    """Request body for persona assignment endpoint."""
    consumer_ids: Optional[list[int]] = None  # None = process all unassigned for the client


# ---------- Response schemas ----------

class PersonaProcessingSummary(BaseModel):
    """Summary returned from a persona assignment run."""
    processed: int
    failed: int
    skipped: int
    low_confidence: int


class ConsumerCsvUploadResponse(BaseModel):
    """Summary returned after a CSV upload."""
    created: int
    skipped: int
    skipped_emails: list[str]
    errors: list[str]
    persona_processing: Optional[PersonaProcessingSummary] = None


class ConsumerResponse(BaseModel):
    """Schema returned to the frontend."""
    id: int
    email: Optional[str] = None
    phone: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    traits: Optional[dict] = None
    # Persona fields
    primary_persona: Optional[PersonaBrief] = None
    secondary_persona: Optional[PersonaBrief] = None
    persona_confidence: Optional[float] = None
    persona_assigned_at: Optional[datetime] = None
    # Timestamps
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
