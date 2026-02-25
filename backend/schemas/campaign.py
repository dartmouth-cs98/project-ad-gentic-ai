"""Pydantic schemas for campaigns — request/response validation."""

import json
from datetime import datetime, date
from decimal import Decimal
from typing import Literal, Optional
from pydantic import BaseModel, field_validator, model_validator

# Valid campaign statuses
CampaignStatus = Literal["draft", "active", "paused", "completed"]


# ---------- Helpers ----------

def _ensure_json(value: Optional[str]) -> Optional[str]:
    """Ensure value satisfies the ISJSON() CHECK constraint.

    Azure SQL's ISJSON() only returns 1 for JSON objects {} and arrays [] —
    it rejects JSON scalar strings like '"text"'. So plain text is wrapped as
    {"text": "..."} rather than being JSON-serialised as a bare scalar.
    Values that are already valid JSON objects/arrays pass through unchanged.
    """
    if value is None:
        return None
    try:
        parsed = json.loads(value)
        # Only objects and arrays satisfy ISJSON() on this Azure SQL instance.
        if isinstance(parsed, (dict, list)):
            return value  # already a valid JSON object/array
        # Scalar JSON value ("string", number, bool) — rewrap as object.
        return json.dumps({"text": parsed})
    except (json.JSONDecodeError, ValueError):
        # Plain text — wrap as JSON object.
        return json.dumps({"text": value})


# ---------- Request schemas ----------

class _DateRangeValidator(BaseModel):
    """Shared validator: end_date must be on or after start_date."""
    start_date: Optional[date] = None
    end_date: Optional[date] = None

    @model_validator(mode="after")
    def end_date_after_start_date(self):
        if self.start_date and self.end_date and self.end_date < self.start_date:
            raise ValueError("end_date must be on or after start_date")
        return self


class CampaignCreate(_DateRangeValidator):
    """Schema for creating a new campaign."""
    business_client_id: int
    name: str
    status: CampaignStatus = "draft"
    budget_total: Optional[Decimal] = None
    goal: Optional[str] = None
    target_audience: Optional[str] = None
    product_context: Optional[str] = None
    product_ids: Optional[str] = None

    @field_validator("product_context", "product_ids", mode="before")
    @classmethod
    def coerce_to_json(cls, v: Optional[str]) -> Optional[str]:
        return _ensure_json(v)


class CampaignUpdate(_DateRangeValidator):
    """Schema for updating a campaign. All fields optional."""
    name: Optional[str] = None
    status: Optional[CampaignStatus] = None
    budget_total: Optional[Decimal] = None
    goal: Optional[str] = None
    target_audience: Optional[str] = None
    product_context: Optional[str] = None
    product_ids: Optional[str] = None

    @field_validator("product_context", "product_ids", mode="before")
    @classmethod
    def coerce_to_json(cls, v: Optional[str]) -> Optional[str]:
        return _ensure_json(v)


# ---------- Response schema ----------

class CampaignResponse(BaseModel):
    """Schema returned to the frontend."""
    id: int
    business_client_id: int
    name: str
    status: str
    budget_total: Optional[Decimal] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    goal: Optional[str] = None
    target_audience: Optional[str] = None
    product_context: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    product_ids: Optional[str] = None

    model_config = {"from_attributes": True}
