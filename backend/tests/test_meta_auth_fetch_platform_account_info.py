"""Tests for Meta OAuth account discovery (Graph /me, /me/accounts, /me/adaccounts)."""

import os
import sys
from pathlib import Path

_backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(_backend_dir))

os.environ.setdefault("ALLOWED_ORIGINS", "http://localhost")

from services.meta.auth import fetch_platform_account_info


class _FakeResp:
    def __init__(self, payload: dict):
        self._payload = payload
        self.status_code = 200

    def raise_for_status(self) -> None:
        pass

    def json(self) -> dict:
        return self._payload


def test_fetch_platform_account_info_calls_me_and_returns_user_fields(monkeypatch):
    """GET /me?fields=id,name runs before pages/adaccounts (used for Meta app review)."""

    calls: list[str] = []

    def fake_get(url: str, params=None, timeout=None):
        calls.append(url)
        if url.endswith("/me"):
            assert params.get("fields") == "id,name"
            assert params.get("access_token") == "tok"
            return _FakeResp({"id": "fb_user_1", "name": "Review User"})
        if "/me/accounts" in url:
            return _FakeResp(
                {
                    "data": [
                        {
                            "id": "page_1",
                            "instagram_business_account": {"id": "ig_1"},
                        }
                    ]
                }
            )
        if "/me/adaccounts" in url:
            return _FakeResp({"data": [{"id": "act_99"}]})
        raise AssertionError(f"unexpected url: {url}")

    monkeypatch.setattr("services.meta.auth.httpx.get", fake_get)

    out = fetch_platform_account_info("tok")

    assert calls[0].endswith("/me")
    assert out["meta_user_id"] == "fb_user_1"
    assert out["meta_user_name"] == "Review User"
    assert out["instagram_account_id"] == "ig_1"
    assert out["facebook_page_id"] == "page_1"
    assert out["ad_account_id"] == "act_99"
