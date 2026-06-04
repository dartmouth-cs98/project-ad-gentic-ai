"""SQLAlchemy model for the dbo.personas table."""

import json
import uuid
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import DateTime, String
from sqlalchemy.orm import Mapped, mapped_column

from database import Base


class Persona(Base):
    """
    Represents a customer persona with the following fields:
    - `id`: Unique identifier (UUID string).
    - `name`: Unique name of the persona.
    - `description`: Detailed description of the persona.
    - `key_motivators`: JSON string representing a list of key motivators.
    - `pain_points`: JSON string representing a list of pain points.
    - `ad_tone_preferences`: Optional JSON string representing a list of preferred ad tones.
    - `created_at`: Timestamp of when the persona was created.
    """

    __tablename__ = "personas"
    __table_args__ = {"schema": "dbo"}

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    name: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    description: Mapped[str] = mapped_column(String, nullable=False)
    key_motivators: Mapped[str] = mapped_column(String, nullable=False)       # JSON string: '["a","b"]'
    pain_points: Mapped[str] = mapped_column(String, nullable=False)          # JSON string
    ad_tone_preferences: Mapped[Optional[str]] = mapped_column(String, nullable=True)  # JSON string
    created_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime, nullable=True, default=lambda: datetime.now(timezone.utc)
    )

    @staticmethod
    def _parse_json_list(v: str | None) -> list[str]:
        return json.loads(v) if v else []

    def get_key_motivators(self) -> list[str]:
        return self._parse_json_list(self.key_motivators)

    def get_pain_points(self) -> list[str]:
        return self._parse_json_list(self.pain_points)

    def get_ad_tone_preferences(self) -> list[str]:
        return self._parse_json_list(self.ad_tone_preferences)

    def __repr__(self) -> str:
        return f"<Persona(name='{self.name}')>"
