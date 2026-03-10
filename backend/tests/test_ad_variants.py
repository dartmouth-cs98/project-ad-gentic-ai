"""Route tests for ad_variants media URL SAS signing behavior."""

import os
import sys
from datetime import datetime, timezone
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import MagicMock

_backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(_backend_dir))

# Allow app to load when ALLOWED_ORIGINS is not set (e.g. CI)
os.environ.setdefault("ALLOWED_ORIGINS", "http://localhost")

from fastapi.testclient import TestClient

from database import get_db
from main import app


def _variant(media_url: str | None) -> SimpleNamespace:
    now = datetime.now(timezone.utc)
    return SimpleNamespace(
        id=10,
        campaign_id=7,
        consumer_id=3,
        product_id=2,
        status="completed",
        media_url=media_url,
        meta='{"script":"test"}',
        version_number=1,
        is_preview=True,
        created_at=now,
        updated_at=now,
        published_at=None,
    )


def _client() -> TestClient:
    def _override_get_db():
        yield MagicMock()

    app.dependency_overrides[get_db] = _override_get_db
    return TestClient(app)


def _clear_overrides():
    app.dependency_overrides.clear()


def test_list_ad_variants_signs_media_url(monkeypatch):
    client = _client()
    try:
        monkeypatch.setenv(
            "AZURE_STORAGE_CONNECTION_STRING",
            "AccountName=testacct;AccountKey=secret;DefaultEndpointsProtocol=https",
        )
        monkeypatch.setattr(
            "routes.ad_variants.get_ad_variants",
            lambda *args, **kwargs: [
                _variant("https://adgenticblob.blob.core.windows.net/ad-videos/ad-videos/8585e8.mp4"),
            ],
        )
        monkeypatch.setattr(
            "routes.ad_variants.generate_blob_sas",
            lambda **kwargs: "sig=abc123",
        )

        res = client.get("/ad-variants/?campaign_id=7")
        assert res.status_code == 200
        body = res.json()
        assert len(body) == 1
        assert body[0]["media_url"].endswith("?sig=abc123")
    finally:
        client.close()
        _clear_overrides()


def test_read_ad_variant_does_not_sign_without_storage_config(monkeypatch):
    client = _client()
    try:
        monkeypatch.delenv("AZURE_STORAGE_CONNECTION_STRING", raising=False)
        raw_url = "https://adgenticblob.blob.core.windows.net/ad-videos/ad-videos/45a61c.mp4"
        monkeypatch.setattr("routes.ad_variants.get_ad_variant", lambda *args, **kwargs: _variant(raw_url))

        res = client.get("/ad-variants/10")
        assert res.status_code == 200
        body = res.json()
        assert body["media_url"] == raw_url
    finally:
        client.close()
        _clear_overrides()


def test_list_ad_variants_appends_sas_to_existing_query(monkeypatch):
    client = _client()
    try:
        monkeypatch.setenv(
            "AZURE_STORAGE_CONNECTION_STRING",
            "AccountName=testacct;AccountKey=secret;DefaultEndpointsProtocol=https",
        )
        monkeypatch.setattr(
            "routes.ad_variants.get_ad_variants",
            lambda *args, **kwargs: [
                _variant("https://adgenticblob.blob.core.windows.net/ad-videos/ad-videos/145198.mp4?foo=bar"),
            ],
        )
        monkeypatch.setattr(
            "routes.ad_variants.generate_blob_sas",
            lambda **kwargs: "sig=abc123",
        )

        res = client.get("/ad-variants/?campaign_id=7")
        assert res.status_code == 200
        body = res.json()
        assert body[0]["media_url"].endswith("?foo=bar&sig=abc123")
    finally:
        client.close()
        _clear_overrides()


def test_read_ad_variant_leaves_non_azure_media_url_unchanged(monkeypatch):
    client = _client()
    try:
        monkeypatch.setenv(
            "AZURE_STORAGE_CONNECTION_STRING",
            "AccountName=testacct;AccountKey=secret;DefaultEndpointsProtocol=https",
        )
        raw_url = "https://cdn.example.com/video.mp4"
        monkeypatch.setattr("routes.ad_variants.get_ad_variant", lambda *args, **kwargs: _variant(raw_url))
        monkeypatch.setattr(
            "routes.ad_variants.generate_blob_sas",
            lambda **kwargs: "sig=abc123",
        )

        res = client.get("/ad-variants/10")
        assert res.status_code == 200
        body = res.json()
        assert body["media_url"] == raw_url
    finally:
        client.close()
        _clear_overrides()
