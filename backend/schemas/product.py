"""Pydantic schemas for products — request/response validation."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class ProductCreate(BaseModel):
    """Schema for creating a new product."""
    name: str = Field(..., min_length=1)
    description: Optional[str] = None
    image_url: Optional[str] = None
    image_name: Optional[str] = None
    product_link: Optional[str] = None
    metadata: Optional[str] = None
    is_active: Optional[bool] = None


class ProductUpdate(BaseModel):
    """Schema for updating a product. All fields optional."""
    name: Optional[str] = Field(None, min_length=1)
    description: Optional[str] = None
    image_url: Optional[str] = None
    image_name: Optional[str] = None
    product_link: Optional[str] = None
    metadata: Optional[str] = None
    is_active: Optional[bool] = None


class ProductResponse(BaseModel):
    """Schema returned to the frontend."""
    id: int
    business_client_id: int
    name: str
    description: Optional[str] = None
    image_url: Optional[str] = None
    image_name: Optional[str] = None
    product_link: Optional[str] = None
    metadata: Optional[str] = None
    is_active: Optional[bool] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True, "populate_by_name": True}