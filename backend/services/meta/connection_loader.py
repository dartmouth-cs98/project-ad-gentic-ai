"""Load and validate a client's Meta (Instagram) social connection for publishing.

The publish flow needs four things from a SocialConnection row:
  - A non-expired encrypted access token
  - The ad account ID  (format: act_XXXXXXXXX)   — in platform_metadata JSON
  - The Facebook page ID                         — in platform_metadata JSON
  - The Instagram business account ID            — in platform_account_id column

If any are missing, raise ``ConnectionValidationError`` with a user-friendly
message the /run route maps to a 400 response.
"""

import json
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy.orm import Session

from models.social_connection import SocialConnection


class ConnectionValidationError(Exception):
    """The Meta connection exists but is unusable for publishing."""


@dataclass(frozen=True)
class ValidatedMetaConnection:
    encrypted_token: str
    ad_account_id: str
    facebook_page_id: str
    instagram_account_id: str


def load_publish_connection(db: Session, client_id: int) -> ValidatedMetaConnection:
    """Return a validated connection or raise ConnectionValidationError."""
    connection: Optional[SocialConnection] = (
        db.query(SocialConnection)
        .filter_by(business_client_id=client_id, platform="instagram")
        .order_by(SocialConnection.connected_at.desc(), SocialConnection.id.desc())
        .first()
    )
    if connection is None:
        raise ConnectionValidationError(
            "Instagram is not connected. Connect it in Settings → Integrations before running a campaign."
        )

    if connection.token_expires_at is not None:
        expires_at = connection.token_expires_at
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        if expires_at <= datetime.now(timezone.utc):
            raise ConnectionValidationError(
                "Your Instagram connection has expired. Reconnect in Settings → Integrations."
            )

    try:
        metadata = json.loads(connection.platform_metadata) if connection.platform_metadata else {}
    except (json.JSONDecodeError, ValueError) as exc:
        raise ConnectionValidationError(
            "Instagram connection metadata is corrupted — please reconnect in Settings."
        ) from exc

    if not isinstance(metadata, dict):
        raise ConnectionValidationError(
            "Instagram connection metadata is corrupted — please reconnect in Settings."
        )

    ad_account_id = metadata.get("ad_account_id")
    facebook_page_id = metadata.get("facebook_page_id")
    instagram_account_id = connection.platform_account_id

    missing = [
        name
        for name, value in (
            ("ad account", ad_account_id),
            ("Facebook page", facebook_page_id),
            ("Instagram business account", instagram_account_id),
        )
        if not value
    ]
    if missing:
        raise ConnectionValidationError(
            "Your Instagram connection is missing: "
            + ", ".join(missing)
            + ". Reconnect in Settings → Integrations to refresh account access."
        )

    return ValidatedMetaConnection(
        encrypted_token=connection.encrypted_token,
        ad_account_id=ad_account_id,
        facebook_page_id=facebook_page_id,
        instagram_account_id=instagram_account_id,
    )
