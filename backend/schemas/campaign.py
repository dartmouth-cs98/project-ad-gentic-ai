"""Pydantic schemas for campaigns — request/response validation."""

import json
from datetime import datetime, date
from decimal import Decimal
from typing import Any, Literal, Optional
from pydantic import BaseModel, Field, field_validator, model_validator

from schemas.campaign_publication import CampaignPublicationResponse
from schemas.generation_preferences import GenerationPreferences, parse_generation_preferences
from utils.draft_generation_preferences import (
    coerce_draft_generation_preferences_input,
    parse_draft_generation_preferences_column,
)

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
    brief: Optional[str] = None
    platforms: Optional[str] = None

    @field_validator("product_context", "product_ids", "brief", "platforms", mode="before")
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
    brief: Optional[str] = None
    platforms: Optional[str] = None
    draft_generation_preferences: Optional[str] = None

    @field_validator("product_context", "product_ids", "brief", "platforms", mode="before")
    @classmethod
    def coerce_to_json(cls, v: Optional[str]) -> Optional[str]:
        return _ensure_json(v)

    @field_validator("draft_generation_preferences", mode="before")
    @classmethod
    def coerce_draft_prefs(cls, v: Any) -> Optional[str]:
        if v is None:
            return None
        return coerce_draft_generation_preferences_input(v)


class CampaignBulkDeleteRequest(BaseModel):
    """Delete multiple campaigns in one request."""

    campaign_ids: list[int] = Field(..., min_length=1, max_length=50)


class CampaignBulkDeleteResponse(BaseModel):
    """Result of a bulk campaign delete."""

    deleted_ids: list[int]
    not_found_ids: list[int]


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
    brief: Optional[str] = None
    platforms: Optional[str] = None
    draft_generation_preferences: Optional[GenerationPreferences] = None
    meta_campaign_id: Optional[str] = None
    publications: list[CampaignPublicationResponse] = []

    @field_validator("draft_generation_preferences", mode="before")
    @classmethod
    def parse_draft_prefs_response(cls, v: Any) -> Optional[GenerationPreferences]:
        if v is None or v == "":
            return None
        if isinstance(v, GenerationPreferences):
            return v
        if isinstance(v, str):
            return parse_draft_generation_preferences_column(v)
        if isinstance(v, dict):
            return parse_generation_preferences(v)
        return None

    model_config = {"from_attributes": True}
