"""OAuth flow for connecting social platform accounts.

GET  /social-auth/connect?platform=instagram  → returns { url } to redirect client to Meta
GET  /social-auth/callback?code=...&state=... → exchanges code, stores token, redirects to frontend
GET  /social-auth/status                      → lists all connected platforms for current client
DELETE /social-auth/disconnect?platform=instagram → removes connection
"""

import json
import logging
import os
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import RedirectResponse
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from database import get_db
from models.social_connection import SocialConnection
from routes.auth import get_current_client_id
from schemas.social_connection import ConnectStatusResponse
from services.meta.auth import (
    build_oauth_url,
    exchange_code_for_long_lived_token,
    encrypt_token,
    fetch_platform_account_info,
    token_expiry_dt,
)

router = APIRouter()
logger = logging.getLogger(__name__)

SUPPORTED_PLATFORMS = {"instagram"}
STATE_ALGORITHM = "HS256"
STATE_TTL_MINUTES = 15


def _make_state(client_id: int) -> str:
    secret = os.environ["JWT_SECRET"]
    return jwt.encode(
        {"client_id": client_id, "exp": datetime.now(timezone.utc).timestamp() + STATE_TTL_MINUTES * 60},
        secret,
        algorithm=STATE_ALGORITHM,
    )


def _decode_state(state: str) -> int:
    secret = os.environ["JWT_SECRET"]
    try:
        payload = jwt.decode(state, secret, algorithms=[STATE_ALGORITHM])
        return int(payload["client_id"])
    except JWTError as exc:
        raise HTTPException(status_code=400, detail="Invalid or expired OAuth state") from exc


@router.get("/connect")
def initiate_connect(
    platform: str = Query(default="instagram"),
    client_id: int = Depends(get_current_client_id),
):
    """Return the OAuth URL for the client to redirect to."""
    if platform not in SUPPORTED_PLATFORMS:
        raise HTTPException(status_code=400, detail=f"Unsupported platform: {platform}")
    state = _make_state(client_id)
    url = build_oauth_url(state)
    return {"url": url}


@router.get("/callback")
def oauth_callback(
    code: str = Query(...),
    state: str = Query(...),
    db: Session = Depends(get_db),
):
    """Meta redirects here after the user grants permissions.

    Exchanges the code for a long-lived token, fetches account IDs,
    and stores an encrypted SocialConnection row.
    Redirects to the frontend settings page with ?connected=instagram.
    """
    frontend_url = os.environ.get("META_FRONTEND_URL", "http://localhost:3000")

    client_id = _decode_state(state)

    try:
        token_data = exchange_code_for_long_lived_token(code)
        access_token: str = token_data["access_token"]
        expires_in: int = token_data.get("expires_in", 60 * 24 * 3600)  # default 60 days
        account_info = fetch_platform_account_info(access_token)
    except Exception:
        logger.exception("Meta OAuth token exchange failed for client %s", client_id)
        return RedirectResponse(f"{frontend_url}/#/settings?error=oauth_failed&tab=integrations")

    encrypted = encrypt_token(access_token)
    platform_metadata = json.dumps({
        "ad_account_id": account_info["ad_account_id"],
        "facebook_page_id": account_info["facebook_page_id"],
    })

    existing = (
        db.query(SocialConnection)
        .filter_by(business_client_id=client_id, platform="instagram")
        .first()
    )
    if existing:
        existing.encrypted_token = encrypted
        existing.token_expires_at = token_expiry_dt(expires_in)
        existing.platform_account_id = account_info["instagram_account_id"]
        existing.platform_metadata = platform_metadata
        existing.connected_at = datetime.now(timezone.utc)
    else:
        db.add(SocialConnection(
            business_client_id=client_id,
            platform="instagram",
            encrypted_token=encrypted,
            token_expires_at=token_expiry_dt(expires_in),
            platform_account_id=account_info["instagram_account_id"],
            platform_metadata=platform_metadata,
        ))

    db.commit()
    logger.info("Stored Instagram connection for client %s", client_id)
    return RedirectResponse(f"{frontend_url}/#/settings?connected=instagram&tab=integrations")


@router.get("/status", response_model=list[ConnectStatusResponse])
def connection_status(
    client_id: int = Depends(get_current_client_id),
    db: Session = Depends(get_db),
):
    """Return connection status for all supported platforms."""
    connections = (
        db.query(SocialConnection)
        .filter_by(business_client_id=client_id)
        .all()
    )
    connected_map = {c.platform: c for c in connections}

    return [
        ConnectStatusResponse(
            platform=platform,
            connected=platform in connected_map,
            platform_account_id=connected_map[platform].platform_account_id if platform in connected_map else None,
            connected_at=connected_map[platform].connected_at if platform in connected_map else None,
        )
        for platform in SUPPORTED_PLATFORMS
    ]


@router.delete("/disconnect")
def disconnect(
    platform: str = Query(default="instagram"),
    client_id: int = Depends(get_current_client_id),
    db: Session = Depends(get_db),
):
    connection = (
        db.query(SocialConnection)
        .filter_by(business_client_id=client_id, platform=platform)
        .first()
    )
    if not connection:
        raise HTTPException(status_code=404, detail="No connection found for this platform")
    db.delete(connection)
    db.commit()
    return {"disconnected": platform}
