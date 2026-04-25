"""Pydantic schemas for personas."""

import json
from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, field_validator


class PersonaResponse(BaseModel):
    """Full persona details — deserializes JSON string array fields."""

    id: UUID
    name: str
    description: str
    key_motivators: list[str]
    pain_points: list[str]
    ad_tone_preferences: Optional[list[str]] = None
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}

    @field_validator("key_motivators", "pain_points", "ad_tone_preferences", mode="before")
    @classmethod
    def parse_json_string(cls, v):
        """Parse JSON strings from Azure SQL into lists."""
        if isinstance(v, str):
            return json.loads(v)
        return v


class PersonaBrief(BaseModel):
    """Minimal persona info embedded in consumer responses."""

    id: UUID
    name: str

    model_config = {"from_attributes": True}
