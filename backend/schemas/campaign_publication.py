"""Pydantic schemas for campaign_publications."""

from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel


PublicationStatus = Literal["active", "paused", "failed"]


class CampaignPublicationResponse(BaseModel):
    id: int
    campaign_id: int
    external_platform: str
    external_campaign_id: str
    status: PublicationStatus
    published_at: Optional[datetime] = None
    error_message: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
