"""Unit tests for campaign publisher failure semantics."""

import os
import sys
from pathlib import Path

import pytest

_backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(_backend_dir))

os.environ.setdefault("ALLOWED_ORIGINS", "http://localhost")

from services.meta.campaign_publisher import MetaPublishError, publish_campaign


def test_publish_campaign_raises_when_all_variant_ads_fail(monkeypatch):
    """If every per-variant ad creation fails, publish_campaign should raise so /run can retry."""

    monkeypatch.setattr("services.meta.campaign_publisher.decrypt_token", lambda _enc: "token")

    def _fake_post(path: str, token: str, payload: dict, *, timeout: float = 30.0) -> dict:
        # publish_campaign only needs /adsets for this test (we pass existing_meta_campaign_id).
        assert token == "token"
        if path.endswith("/adsets"):
            return {"id": "adset_1"}
        raise AssertionError(f"Unexpected _post call: {path}")

    monkeypatch.setattr("services.meta.campaign_publisher._post", _fake_post)

    def _fail_create_ad_for_variant(**_kwargs):
        raise RuntimeError("boom")

    monkeypatch.setattr(
        "services.meta.campaign_publisher._create_ad_for_variant", _fail_create_ad_for_variant
    )

    persona_groups = [
        {
            "persona_name": "Persona A",
            "persona_traits": {},
            "variants": [{"id": 1, "media_url": "https://example.com/v.mp4", "script": "hi"}],
        }
    ]

    with pytest.raises(MetaPublishError) as exc:
        publish_campaign(
            campaign_name="C",
            goal="traffic",
            budget_total=300.0,
            start_date=None,
            end_date=None,
            persona_groups=persona_groups,
            encrypted_token="enc",
            ad_account_id="act_123",
            instagram_account_id="ig_1",
            facebook_page_id="page_1",
            existing_meta_campaign_id="meta_existing_1",
        )

    assert exc.value.meta_campaign_id == "meta_existing_1"

