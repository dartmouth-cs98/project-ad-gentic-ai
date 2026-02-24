"""Pydantic schemas for campaigns — request/response validation."""

from datetime import datetime, date
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel


# ---------- Request schemas ----------

class CampaignCreate(BaseModel):
    """Schema for creating a new campaign."""
    business_client_id: int
    name: str
    status: str = "draft"
    budget_total: Optional[Decimal] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    goal: Optional[str] = None
    target_audience: Optional[str] = None
    product_context: Optional[str] = None
    product_ids: Optional[str] = None


class CampaignUpdate(BaseModel):
    """Schema for updating a campaign. All fields optional."""
    name: Optional[str] = None
    status: Optional[str] = None
    budget_total: Optional[Decimal] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
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
