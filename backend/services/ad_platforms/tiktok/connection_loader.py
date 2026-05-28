"""Load and validate a client's TikTok social connection for publishing.

Differences from Meta:

  - TikTok access tokens expire in ~24h (vs Meta's 60d). We refresh on use:
    if ``token_expires_at`` is past or near, call /oauth2/refresh_token/,
    persist the new token (and rotated refresh_token), and return the
    fresh encrypted access token to the caller.
  - The user can grant access to multiple advertiser IDs in one OAuth
    flow. We store the full list and publish under the first one until
    a UI picker is added.
  - Refresh credentials live in ``platform_metadata`` as
    ``encrypted_refresh_token`` so we don't need a schema change.
"""

import json
import logging
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy.orm import Session

from models.social_connection import SocialConnection
from services.ad_platforms._base.encryption import decrypt_token, encrypt_token
from services.ad_platforms.tiktok.auth import (
    default_access_ttl_seconds,
    default_refresh_ttl_seconds,
    extract_advertiser_ids,
    is_access_token_expired,
    refresh_access_token,
    token_expiry_dt,
)

logger = logging.getLogger(__name__)


class ConnectionValidationError(Exception):
    """The TikTok connection exists but is unusable for publishing."""


@dataclass(frozen=True)
class ValidatedTikTokConnection:
    encrypted_token: str
    advertiser_id: str                 # The one we publish under (first in the list for now).
    advertiser_ids: tuple[str, ...]    # Everything the user granted access to.


def _parse_metadata(raw: Optional[str]) -> dict:
    if not raw:
        return {}
    try:
        parsed = json.loads(raw)
    except (json.JSONDecodeError, ValueError):
        raise ConnectionValidationError(
            "TikTok connection metadata is corrupted — please reconnect in Settings."
        )
    if not isinstance(parsed, dict):
        raise ConnectionValidationError(
            "TikTok connection metadata is corrupted — please reconnect in Settings."
        )
    return parsed


def _refresh_and_persist(
    db: Session,
    connection: SocialConnection,
    metadata: dict,
) -> None:
    """Refresh the access token using the stored refresh_token and save the new pair.

    Mutates ``connection`` and commits. Raises ConnectionValidationError on
    irrecoverable failure so the route can prompt a reconnect.
    """
    encrypted_refresh = metadata.get("encrypted_refresh_token")
    if not encrypted_refresh:
        raise ConnectionValidationError(
            "TikTok refresh token is missing — please reconnect in Settings."
        )

    try:
        refresh_token = decrypt_token(encrypted_refresh)
    except Exception as exc:
        raise ConnectionValidationError(
            "TikTok refresh token could not be decrypted — please reconnect in Settings."
        ) from exc

    try:
        data = refresh_access_token(refresh_token)
    except Exception as exc:
        logger.warning("TikTok token refresh failed for connection %s", connection.id, exc_info=True)
        raise ConnectionValidationError(
            "Your TikTok connection has expired and could not be refreshed. Reconnect in Settings."
        ) from exc

    new_access = data.get("access_token")
    new_refresh = data.get("refresh_token") or refresh_token  # fall back if not rotated
    if not new_access:
        raise ConnectionValidationError(
            "TikTok refresh response missing access_token — please reconnect in Settings."
        )

    access_ttl = int(data.get("access_token_expires_in") or default_access_ttl_seconds())
    refresh_ttl = int(data.get("refresh_token_expires_in") or default_refresh_ttl_seconds())

    connection.encrypted_token = encrypt_token(new_access)
    connection.token_expires_at = token_expiry_dt(access_ttl)
    metadata["encrypted_refresh_token"] = encrypt_token(new_refresh)
    metadata["refresh_token_expires_at"] = token_expiry_dt(refresh_ttl).isoformat()

    # Advertiser IDs can shift if the user revoked access in TikTok — keep the
    # canonical list fresh from the refresh response when it provides them.
    refreshed_ids = extract_advertiser_ids(data)
    if refreshed_ids:
        metadata["advertiser_ids"] = refreshed_ids
        if metadata.get("active_advertiser_id") not in refreshed_ids:
            metadata["active_advertiser_id"] = refreshed_ids[0]

    connection.platform_metadata = json.dumps(metadata)
    connection.connected_at = datetime.now(timezone.utc)
    db.commit()
    logger.info("Refreshed TikTok access token for connection %s", connection.id)


def load_publish_connection(db: Session, client_id: int) -> ValidatedTikTokConnection:
    """Return a validated TikTok connection or raise ConnectionValidationError.

    Refreshes the access token if it is at/near expiry. Persists the rotated
    pair to the SocialConnection row before returning.
    """
    connection: Optional[SocialConnection] = (
        db.query(SocialConnection)
        .filter_by(business_client_id=client_id, platform="tiktok")
        .order_by(SocialConnection.connected_at.desc(), SocialConnection.id.desc())
        .first()
    )
    if connection is None:
        raise ConnectionValidationError(
            "TikTok is not connected. Connect it in Settings → Integrations before running a campaign."
        )

    metadata = _parse_metadata(connection.platform_metadata)

    if is_access_token_expired(connection.token_expires_at):
        _refresh_and_persist(db, connection, metadata)
        metadata = _parse_metadata(connection.platform_metadata)  # reload after rotation

    advertiser_ids = metadata.get("advertiser_ids") or []
    active = metadata.get("active_advertiser_id")
    if not advertiser_ids or not active:
        raise ConnectionValidationError(
            "Your TikTok connection is missing an advertiser account. "
            "Reconnect in Settings → Integrations."
        )

    return ValidatedTikTokConnection(
        encrypted_token=connection.encrypted_token,
        advertiser_id=str(active),
        advertiser_ids=tuple(str(v) for v in advertiser_ids),
    )
