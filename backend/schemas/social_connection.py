"""Pydantic schemas for social_connections."""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class SocialConnectionResponse(BaseModel):
    id: int
    business_client_id: int
    platform: str
    token_expires_at: Optional[datetime]
    platform_account_id: Optional[str]
    platform_metadata: Optional[str]
    connected_at: datetime

    model_config = {"from_attributes": True}


class ConnectStatusResponse(BaseModel):
    """Summary of connected platforms for a client."""
    platform: str
    connected: bool
    platform_account_id: Optional[str] = None
    connected_at: Optional[datetime] = None
