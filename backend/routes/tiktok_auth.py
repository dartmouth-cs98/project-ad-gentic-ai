"""OAuth flow for connecting a TikTok ad account.

GET  /api/tiktok/connect    → returns { url } to redirect the client to TikTok
GET  /api/tiktok/callback   → TikTok redirects here after authorization

This file mirrors the Meta flow in ``routes/social_auth.py`` but lives
under its own prefix because TikTok's dev portal pins the callback path
to ``/api/tiktok/callback``.

TODO: When a third platform (Google, YouTube) lands, lift the JWT
``state`` helpers into ``utils/oauth_state.py`` and have all three
platform routes import them.
"""

import json
import logging
import os
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import RedirectResponse
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from database import get_db
from models.social_connection import SocialConnection
from routes.auth import get_current_client_id
from services.ad_platforms._base.encryption import encrypt_token
from services.ad_platforms.tiktok.auth import (
    build_oauth_url,
    default_access_ttl_seconds,
    default_refresh_ttl_seconds,
    exchange_code_for_token,
    extract_advertiser_ids,
    token_expiry_dt,
)

router = APIRouter()
logger = logging.getLogger(__name__)

_STATE_ALGORITHM = "HS256"
_STATE_TTL_MINUTES = 15


def _make_state(client_id: int) -> str:
    secret = os.environ["JWT_SECRET"]
    return jwt.encode(
        {
            "client_id": client_id,
            "exp": datetime.now(timezone.utc).timestamp() + _STATE_TTL_MINUTES * 60,
        },
        secret,
        algorithm=_STATE_ALGORITHM,
    )


def _decode_state(state: str) -> int:
    secret = os.environ["JWT_SECRET"]
    try:
        payload = jwt.decode(state, secret, algorithms=[_STATE_ALGORITHM])
        return int(payload["client_id"])
    except JWTError as exc:
        raise HTTPException(status_code=400, detail="Invalid or expired OAuth state") from exc


@router.get("/connect")
def initiate_tiktok_connect(client_id: int = Depends(get_current_client_id)):
    """Return the TikTok authorize URL the client should redirect to."""
    state = _make_state(client_id)
    url = build_oauth_url(state)
    return {"url": url}


@router.get("/callback")
def tiktok_oauth_callback(
    code: Optional[str] = Query(default=None),
    state: Optional[str] = Query(default=None),
    auth_code: Optional[str] = Query(default=None),
    db: Session = Depends(get_db),
):
    """TikTok redirects here after the user grants permissions.

    TikTok's docs show the auth code in different param names across
    versions (``code`` vs ``auth_code``) — accept either.

    Exchanges the code for an access_token + refresh_token + advertiser_ids,
    encrypts both tokens, and upserts a SocialConnection row.
    Redirects to the frontend settings page with ?connected=tiktok.
    """
    frontend_url = os.environ.get("TIKTOK_FRONTEND_URL", "http://localhost:3000")

    incoming_code = code or auth_code
    if not incoming_code or not state:
        return RedirectResponse(
            f"{frontend_url}/#/settings?error=oauth_missing_params&tab=integrations"
        )

    client_id = _decode_state(state)

    try:
        data = exchange_code_for_token(incoming_code)
        access_token: str = data["access_token"]
        refresh_token: str = data.get("refresh_token") or ""
        advertiser_ids = extract_advertiser_ids(data)
        access_ttl = int(data.get("access_token_expires_in") or default_access_ttl_seconds())
        refresh_ttl = int(data.get("refresh_token_expires_in") or default_refresh_ttl_seconds())
    except Exception:
        logger.exception("TikTok OAuth token exchange failed for client %s", client_id)
        return RedirectResponse(
            f"{frontend_url}/#/settings?error=oauth_failed&tab=integrations"
        )

    if not advertiser_ids:
        logger.warning("TikTok returned no advertiser_ids for client %s", client_id)
        return RedirectResponse(
            f"{frontend_url}/#/settings?error=oauth_no_advertisers&tab=integrations"
        )

    encrypted_access = encrypt_token(access_token)
    encrypted_refresh = encrypt_token(refresh_token) if refresh_token else None
    platform_metadata = {
        "advertiser_ids": advertiser_ids,
        "active_advertiser_id": advertiser_ids[0],
    }
    if encrypted_refresh:
        platform_metadata["encrypted_refresh_token"] = encrypted_refresh
        platform_metadata["refresh_token_expires_at"] = token_expiry_dt(refresh_ttl).isoformat()
    platform_metadata_str = json.dumps(platform_metadata)

    existing = (
        db.query(SocialConnection)
        .filter_by(business_client_id=client_id, platform="tiktok")
        .first()
    )
    if existing:
        existing.encrypted_token = encrypted_access
        existing.token_expires_at = token_expiry_dt(access_ttl)
        existing.platform_account_id = advertiser_ids[0]
        existing.platform_metadata = platform_metadata_str
        existing.connected_at = datetime.now(timezone.utc)
    else:
        db.add(SocialConnection(
            business_client_id=client_id,
            platform="tiktok",
            encrypted_token=encrypted_access,
            token_expires_at=token_expiry_dt(access_ttl),
            platform_account_id=advertiser_ids[0],
            platform_metadata=platform_metadata_str,
        ))

    db.commit()
    logger.info("Stored TikTok connection for client %s (advertisers=%d)", client_id, len(advertiser_ids))
    return RedirectResponse(f"{frontend_url}/#/settings?connected=tiktok&tab=integrations")
