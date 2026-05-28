"""Tests for services/ad_platforms/tiktok/auth.py — URL build, code exchange, refresh."""

import os
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path
from urllib.parse import parse_qs, urlparse

import httpx
import pytest

_backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(_backend_dir))

os.environ.setdefault("ALLOWED_ORIGINS", "http://localhost")

from services.ad_platforms.tiktok import auth as tiktok_auth


@pytest.fixture(autouse=True)
def _tiktok_env(monkeypatch):
    monkeypatch.setenv("TIKTOK_APP_ID", "test-app-id")
    monkeypatch.setenv("TIKTOK_APP_SECRET", "test-app-secret")
    monkeypatch.setenv(
        "TIKTOK_REDIRECT_URI", "http://localhost:8000/api/tiktok/callback"
    )
    monkeypatch.setenv(
        "TIKTOK_API_BASE_URL", "https://sandbox-ads.tiktok.com/open_api/v1.3"
    )


class _FakeResponse:
    def __init__(self, payload: dict, status_code: int = 200):
        self._payload = payload
        self.status_code = status_code

    def raise_for_status(self) -> None:
        if self.status_code >= 400:
            raise httpx.HTTPStatusError(
                f"{self.status_code}",
                request=httpx.Request("POST", "http://test"),
                response=httpx.Response(self.status_code),
            )

    def json(self) -> dict:
        return self._payload


def test_build_oauth_url_includes_required_params():
    url = tiktok_auth.build_oauth_url("abc.def.state")

    parsed = urlparse(url)
    assert parsed.scheme == "https"
    assert "business-api.tiktok.com" in parsed.netloc
    assert parsed.path == "/portal/auth"

    qs = parse_qs(parsed.query)
    assert qs["app_id"] == ["test-app-id"]
    assert qs["state"] == ["abc.def.state"]
    assert qs["redirect_uri"] == ["http://localhost:8000/api/tiktok/callback"]
    # Scopes are tied to the app on TikTok's server — must not be on the URL.
    assert "scope" not in qs


def test_build_oauth_url_raises_when_env_missing(monkeypatch):
    monkeypatch.delenv("TIKTOK_APP_ID", raising=False)
    with pytest.raises(RuntimeError, match="TIKTOK_APP_ID"):
        tiktok_auth.build_oauth_url("state")


def test_exchange_code_sends_json_content_type(monkeypatch):
    captured = {}

    def fake_post(url, json, headers, timeout):
        captured["url"] = url
        captured["json"] = json
        captured["headers"] = headers
        return _FakeResponse({
            "code": 0,
            "message": "OK",
            "data": {
                "access_token": "act_xyz",
                "refresh_token": "rft_xyz",
                "advertiser_ids": ["7644230008365416466"],
                "access_token_expires_in": 86400,
                "refresh_token_expires_in": 31536000,
            },
        })

    monkeypatch.setattr(tiktok_auth.httpx, "post", fake_post)

    data = tiktok_auth.exchange_code_for_token("auth_code_123")

    assert captured["url"].endswith("/oauth2/access_token/")
    # Quirk #2: TikTok requires application/json on token exchange.
    assert captured["headers"]["Content-Type"] == "application/json"
    assert captured["json"] == {
        "app_id": "test-app-id",
        "secret": "test-app-secret",
        "auth_code": "auth_code_123",
    }
    assert data["access_token"] == "act_xyz"
    assert data["refresh_token"] == "rft_xyz"
    assert data["advertiser_ids"] == ["7644230008365416466"]


def test_exchange_code_raises_when_tiktok_returns_error_code(monkeypatch):
    def fake_post(url, json, headers, timeout):
        return _FakeResponse({"code": 10002, "message": "Invalid Parameter", "data": None})

    monkeypatch.setattr(tiktok_auth.httpx, "post", fake_post)

    with pytest.raises(RuntimeError, match="10002"):
        tiktok_auth.exchange_code_for_token("auth_code_123")


def test_refresh_access_token_sends_refresh_token(monkeypatch):
    captured = {}

    def fake_post(url, json, headers, timeout):
        captured["url"] = url
        captured["json"] = json
        return _FakeResponse({
            "code": 0,
            "message": "OK",
            "data": {
                "access_token": "act_new",
                "refresh_token": "rft_new",
                "advertiser_ids": ["123"],
                "access_token_expires_in": 86400,
                "refresh_token_expires_in": 31536000,
            },
        })

    monkeypatch.setattr(tiktok_auth.httpx, "post", fake_post)

    data = tiktok_auth.refresh_access_token("rft_old")

    assert captured["url"].endswith("/oauth2/refresh_token/")
    assert captured["json"]["refresh_token"] == "rft_old"
    assert data["access_token"] == "act_new"
    assert data["refresh_token"] == "rft_new"


def test_extract_advertiser_ids_normalizes_to_strings():
    assert tiktok_auth.extract_advertiser_ids({"advertiser_ids": [123, "456", None, 789]}) == [
        "123", "456", "789"
    ]
    assert tiktok_auth.extract_advertiser_ids({}) == []
    assert tiktok_auth.extract_advertiser_ids({"advertiser_ids": None}) == []


def test_is_access_token_expired_treats_none_as_expired():
    assert tiktok_auth.is_access_token_expired(None) is True


def test_is_access_token_expired_uses_skew():
    # 30 seconds in the future, default skew of 60s → treated as expired.
    near_future = datetime.now(timezone.utc) + timedelta(seconds=30)
    assert tiktok_auth.is_access_token_expired(near_future) is True

    # 2 hours out, well past skew → not expired.
    far_future = datetime.now(timezone.utc) + timedelta(hours=2)
    assert tiktok_auth.is_access_token_expired(far_future) is False


def test_is_access_token_expired_handles_naive_datetimes():
    """SQLAlchemy may load naive datetimes; treat as UTC, not crash."""
    naive_future = (datetime.now(timezone.utc) + timedelta(hours=2)).replace(tzinfo=None)
    assert tiktok_auth.is_access_token_expired(naive_future) is False
