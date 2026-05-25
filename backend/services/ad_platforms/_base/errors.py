"""Shared error types for ad platform publishers.

Routes catch ``PublishError`` and map it to a single 4xx/5xx response shape;
each platform raises its own subclass (``MetaPublishError``, ``TikTokPublishError``…)
that carries platform-specific context like the external campaign ID created
before the failure (so retries can resume from that point).
"""

from typing import Optional


class PublishError(Exception):
    """Base class for any ad platform publish failure.

    ``external_campaign_id`` is the platform's campaign ID if creation
    succeeded before a later step (ad set, ad) failed. Callers persist
    it so a retry can skip campaign creation and pick up where we left off.
    """

    def __init__(self, message: str, external_campaign_id: Optional[str] = None):
        super().__init__(message)
        self.external_campaign_id = external_campaign_id
