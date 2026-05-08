"""Pydantic schemas for products — request/response validation."""

import json
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field, field_validator


class ProductCreate(BaseModel):
    """Schema for creating a new product."""
    name: str = Field(..., min_length=1)
    description: Optional[str] = None
    product_link: Optional[str] = None
    product_metadata: Optional[str] = None
    is_active: Optional[bool] = None


class ProductUpdate(BaseModel):
    """Schema for updating a product. All fields optional."""
    name: Optional[str] = Field(None, min_length=1)
    description: Optional[str] = None
    image_url: Optional[str] = None    # raw JSON string — set by upload/delete routes only
    image_name: Optional[str] = None   # raw JSON string — set by upload/delete routes only
    product_link: Optional[str] = None
    product_metadata: Optional[str] = None
    is_active: Optional[bool] = None


class ProductResponse(BaseModel):
    """Schema returned to the frontend."""
    id: int
    business_client_id: int
    name: str
    description: Optional[str] = None
    image_urls: list[str] = []         # deserialised from image_url JSON column
    image_names: list[str] = []        # deserialised from image_name JSON column
    product_link: Optional[str] = None
    product_metadata: Optional[str] = None
    is_active: Optional[bool] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True, "populate_by_name": True}

    @field_validator("image_urls", mode="before")
    @classmethod
    def parse_image_urls(cls, v: object) -> list[str]:
        """DB stores a JSON array string or a legacy plain URL string."""
        if v is None:
            return []
        if isinstance(v, list):
            return v
        if isinstance(v, str):
            v = v.strip()
            if not v:
                return []
            try:
                parsed = json.loads(v)
                if isinstance(parsed, list):
                    return [str(x) for x in parsed if x]
                # Stored as a JSON string (quoted URL) — unwrap it
                return [str(parsed)]
            except (json.JSONDecodeError, ValueError):
                # Legacy plain URL — wrap in list
                return [v]
        return []

    @field_validator("image_names", mode="before")
    @classmethod
    def parse_image_names(cls, v: object) -> list[str]:
        """Same deserialization logic as image_urls."""
        if v is None:
            return []
        if isinstance(v, list):
            return v
        if isinstance(v, str):
            v = v.strip()
            if not v:
                return []
            try:
                parsed = json.loads(v)
                if isinstance(parsed, list):
                    return [str(x) for x in parsed if x]
                return [str(parsed)]
            except (json.JSONDecodeError, ValueError):
                return [v]
        return []

    # Map ORM column names → response field names
    @classmethod
    def model_validate(cls, obj, **kwargs):  # type: ignore[override]
        if hasattr(obj, "__dict__") and not isinstance(obj, dict):
            data = {
                **obj.__dict__,
                "image_urls": getattr(obj, "image_url", None),
                "image_names": getattr(obj, "image_name", None),
            }
            return super().model_validate(data, **kwargs)
        return super().model_validate(obj, **kwargs)
