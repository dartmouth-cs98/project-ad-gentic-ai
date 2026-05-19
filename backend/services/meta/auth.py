"""Meta OAuth helpers: token encryption, URL building, code exchange.

Uses the Facebook Login flow (not Instagram Login) because we need
ads_management for paid campaign publishing, and instagram_basic so
/me/accounts returns the Page's linked Instagram business account.
"""

import os
from datetime import datetime, timedelta, timezone
from typing import Optional

import httpx
from cryptography.fernet import Fernet

META_GRAPH_VERSION = "v21.0"
META_GRAPH_BASE = f"https://graph.facebook.com/{META_GRAPH_VERSION}"
META_DIALOG_URL = "https://www.facebook.com/dialog/oauth"

META_SCOPES = ",".join([
    "ads_management",
    "ads_read",
    "instagram_basic",
    "pages_read_engagement",
    "pages_show_list",
    "business_management",
])


def _fernet() -> Fernet:
    key = os.environ.get("FERNET_SECRET_KEY")
    if not key:
        raise RuntimeError("FERNET_SECRET_KEY env var not set")
    return Fernet(key.encode())


def encrypt_token(token: str) -> str:
    return _fernet().encrypt(token.encode()).decode()


def decrypt_token(encrypted: str) -> str:
    return _fernet().decrypt(encrypted.encode()).decode()


def build_oauth_url(state: str) -> str:
    """Build Facebook Login URL with auth_type=rerequest so Meta re-opens the permissions
    dialog when scopes change (otherwise repeat logins can reuse the old grant).
    """
    app_id = os.environ.get("META_APP_ID")
    redirect_uri = os.environ.get("META_REDIRECT_URI")
    if not app_id or not redirect_uri:
        raise RuntimeError("META_APP_ID and META_REDIRECT_URI must be set")

    params = (
        f"client_id={app_id}"
        f"&redirect_uri={redirect_uri}"
        f"&scope={META_SCOPES}"
        f"&response_type=code"
        f"&auth_type=rerequest"
        f"&state={state}"
    )
    return f"{META_DIALOG_URL}?{params}"


def exchange_code_for_long_lived_token(code: str) -> dict:
    """Exchange auth code → short-lived → long-lived user token (60-day expiry)."""
    app_id = os.environ.get("META_APP_ID")
    app_secret = os.environ.get("META_APP_SECRET")
    redirect_uri = os.environ.get("META_REDIRECT_URI")

    # Step 1: code → short-lived token
    r1 = httpx.get(
        f"{META_GRAPH_BASE}/oauth/access_token",
        params={
            "client_id": app_id,
            "client_secret": app_secret,
            "redirect_uri": redirect_uri,
            "code": code,
        },
        timeout=15,
    )
    r1.raise_for_status()

    # Step 2: short-lived → long-lived (60 days)
    r2 = httpx.get(
        f"{META_GRAPH_BASE}/oauth/access_token",
        params={
            "grant_type": "fb_exchange_token",
            "client_id": app_id,
            "client_secret": app_secret,
            "fb_exchange_token": r1.json()["access_token"],
        },
        timeout=15,
    )
    r2.raise_for_status()
    return r2.json()  # {"access_token": str, "token_type": str, "expires_in": int}


def fetch_platform_account_info(access_token: str) -> dict:
    """Return IG business account ID, Facebook Page ID, and first Ad Account ID.

    Returns:
        {
            "instagram_account_id": str | None,
            "facebook_page_id": str | None,
            "ad_account_id": str | None,   # format: act_XXXXXXXXX
        }
    """
    instagram_account_id: Optional[str] = None
    facebook_page_id: Optional[str] = None
    ad_account_id: Optional[str] = None

    # Facebook Pages managed by this user, with linked IG account 
    pages = httpx.get(
        f"{META_GRAPH_BASE}/me/accounts",
        params={
            "access_token": access_token,
            "fields": "id,name,instagram_business_account",
        },
        timeout=15,
    )
    pages.raise_for_status()
    for page in pages.json().get("data", []):
        if "instagram_business_account" in page:
            facebook_page_id = page["id"]
            instagram_account_id = page["instagram_business_account"]["id"]
            break

    # Ad accounts accessible to this user
    ads = httpx.get(
        f"{META_GRAPH_BASE}/me/adaccounts",
        params={"access_token": access_token, "fields": "id,name,account_status"},
        timeout=15,
    )
    ads.raise_for_status()
    accounts = ads.json().get("data", [])
    if accounts:
        ad_account_id = accounts[0]["id"]

    return {
        "instagram_account_id": instagram_account_id,
        "facebook_page_id": facebook_page_id,
        "ad_account_id": ad_account_id,
    }


def token_expiry_dt(expires_in: int) -> datetime:
    return datetime.now(timezone.utc) + timedelta(seconds=expires_in)
