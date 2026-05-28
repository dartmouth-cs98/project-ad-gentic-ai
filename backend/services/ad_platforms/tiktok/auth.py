"""TikTok OAuth helpers: authorize URL, code exchange, refresh.

TikTok's flow differs from Meta in three ways that matter here:

  1. Token exchange MUST send ``Content-Type: application/json`` (not form
     data). Sending form-encoded returns ``10002: Invalid Parameter``.
  2. The token-exchange response wraps the real data under ``data`` and
     includes both an access_token (~24h) and a refresh_token (~1yr).
  3. The response carries an ``advertiser_ids`` array — the user can grant
     access to multiple ad accounts in one authorize flow.

Scopes are NOT passed on the authorize URL. They live on TikTok's server
tied to the app_id — whatever you ticked in the dev portal is what the
user grants.

Sandbox vs production is selected by ``TIKTOK_API_BASE_URL`` (defaults to
sandbox).
"""

import os
from datetime import datetime, timedelta, timezone
from typing import Optional
from urllib.parse import quote_plus

import httpx

_DEFAULT_AUTH_PORTAL_URL = "https://business-api.tiktok.com/portal/auth"
_DEFAULT_API_BASE_URL = "https://sandbox-ads.tiktok.com/open_api/v1.3"


def _api_base_url() -> str:
    return os.environ.get("TIKTOK_API_BASE_URL", _DEFAULT_API_BASE_URL).rstrip("/")


def _auth_portal_url() -> str:
    return os.environ.get("TIKTOK_AUTH_PORTAL_URL", _DEFAULT_AUTH_PORTAL_URL)


def build_oauth_url(state: str) -> str:
    """Return the TikTok authorize URL the client should redirect to.

    The portal URL TikTok generates for an app looks like:
      {portal}?app_id={id}&state={state}&redirect_uri={url-encoded callback}

    ``state`` is opaque to TikTok and round-trips back on the callback.
    Callers pack the business_client_id into it as a signed JWT.
    """
    app_id = os.environ.get("TIKTOK_APP_ID")
    redirect_uri = os.environ.get("TIKTOK_REDIRECT_URI")
    if not app_id or not redirect_uri:
        raise RuntimeError("TIKTOK_APP_ID and TIKTOK_REDIRECT_URI must be set")

    params = (
        f"app_id={app_id}"
        f"&state={quote_plus(state)}"
        f"&redirect_uri={quote_plus(redirect_uri)}"
    )
    return f"{_auth_portal_url()}?{params}"


def _unwrap_tiktok_response(body: dict) -> dict:
    """TikTok wraps every response as ``{code, message, data}``. Raise on non-zero ``code``."""
    if not isinstance(body, dict):
        raise RuntimeError(f"Unexpected TikTok response shape: {body!r}")
    if body.get("code") != 0:
        raise RuntimeError(
            f"TikTok API error (code={body.get('code')}): {body.get('message')!r}"
        )
    data = body.get("data")
    if not isinstance(data, dict):
        raise RuntimeError(f"TikTok response missing data: {body!r}")
    return data


def exchange_code_for_token(code: str) -> dict:
    """Exchange the auth_code for access + refresh tokens.

    Returns the unwrapped ``data`` dict from TikTok with at least:
        access_token, refresh_token, advertiser_ids,
        access_token_expires_in, refresh_token_expires_in
    """
    app_id = os.environ.get("TIKTOK_APP_ID")
    app_secret = os.environ.get("TIKTOK_APP_SECRET")
    if not app_id or not app_secret:
        raise RuntimeError("TIKTOK_APP_ID and TIKTOK_APP_SECRET must be set")

    payload = {"app_id": app_id, "secret": app_secret, "auth_code": code}
    resp = httpx.post(
        f"{_api_base_url()}/oauth2/access_token/",
        json=payload,
        headers={"Content-Type": "application/json"},
        timeout=15,
    )
    resp.raise_for_status()
    return _unwrap_tiktok_response(resp.json())


def refresh_access_token(refresh_token: str) -> dict:
    """Exchange a refresh_token for a new access_token (and a rotated refresh_token).

    Returns the same shape as ``exchange_code_for_token``.
    """
    app_id = os.environ.get("TIKTOK_APP_ID")
    app_secret = os.environ.get("TIKTOK_APP_SECRET")
    if not app_id or not app_secret:
        raise RuntimeError("TIKTOK_APP_ID and TIKTOK_APP_SECRET must be set")

    payload = {"app_id": app_id, "secret": app_secret, "refresh_token": refresh_token}
    resp = httpx.post(
        f"{_api_base_url()}/oauth2/refresh_token/",
        json=payload,
        headers={"Content-Type": "application/json"},
        timeout=15,
    )
    resp.raise_for_status()
    return _unwrap_tiktok_response(resp.json())


def token_expiry_dt(expires_in: int) -> datetime:
    return datetime.now(timezone.utc) + timedelta(seconds=expires_in)


def extract_advertiser_ids(token_payload: dict) -> list[str]:
    """Pull advertiser_ids out of the token-exchange or refresh response.

    Some TikTok variants return strings, some ints — normalize to str.
    """
    raw = token_payload.get("advertiser_ids") or []
    return [str(v) for v in raw if v is not None]


def default_access_ttl_seconds() -> int:
    """Fallback access-token TTL when TikTok omits it (~24h)."""
    return 24 * 3600


def default_refresh_ttl_seconds() -> int:
    """Fallback refresh-token TTL when TikTok omits it (~1 year)."""
    return 365 * 24 * 3600


def is_access_token_expired(expires_at: Optional[datetime], skew_seconds: int = 60) -> bool:
    """True if the stored access token is past (or within ``skew_seconds`` of) expiry."""
    if expires_at is None:
        return True
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    return expires_at <= datetime.now(timezone.utc) + timedelta(seconds=skew_seconds)
