"""Pydantic schemas for campaigns — request/response validation."""

from datetime import datetime, date
from decimal import Decimal
from typing import Literal, Optional
from pydantic import BaseModel, model_validator

# Valid campaign statuses
CampaignStatus = Literal["draft", "active", "paused", "completed"]


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


class CampaignUpdate(_DateRangeValidator):
    """Schema for updating a campaign. All fields optional."""
    name: Optional[str] = None
    status: Optional[CampaignStatus] = None
    budget_total: Optional[Decimal] = None
    goal: Optional[str] = None
    target_audience: Optional[str] = None
    product_context: Optional[str] = None
    product_ids: Optional[str] = None


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
