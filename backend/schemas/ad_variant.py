"""Pydantic schemas for ad_variants — request/response validation."""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel


# ---------- Request schemas ----------

class AdVariantCreate(BaseModel):
    """Schema for creating a new ad variant."""
    campaign_id: int
    consumer_id: Optional[int] = None
    product_id: Optional[int] = None
    status: str = "creating"
    media_url: Optional[str] = None
    meta: Optional[str] = None
    version_number: int = 1


class AdVariantUpdate(BaseModel):
    """Schema for updating an ad variant. All fields optional."""
    campaign_id: Optional[int] = None
    consumer_id: Optional[int] = None
    status: Optional[str] = None
    media_url: Optional[str] = None
    meta: Optional[str] = None
    version_number: Optional[int] = None
    published_at: Optional[datetime] = None


# ---------- Response schema ----------

class AdVariantResponse(BaseModel):
    """Schema returned to the frontend."""
    id: int
    campaign_id: int
    consumer_id: Optional[int] = None
    status: str
    media_url: Optional[str] = None
    meta: Optional[str] = None
    version_number: int
    created_at: datetime
    updated_at: datetime
    published_at: Optional[datetime] = None

    model_config = {"from_attributes": True}
