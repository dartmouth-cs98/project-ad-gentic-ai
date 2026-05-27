"""Tests for signed_ad_video_blob_url helper."""

import sys
from pathlib import Path

_backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(_backend_dir))

from services.storage.ad_video_media_url import signed_ad_video_blob_url


def test_signed_ad_video_blob_url_includes_sig(monkeypatch):
    monkeypatch.setenv(
        "AZURE_STORAGE_CONNECTION_STRING",
        "DefaultEndpointsProtocol=https;AccountName=testacct;AccountKey="
        "dGVzdGtleXRlc3RrZXl0ZXN0a2V5dGVzdGtleTE=;EndpointSuffix=core.windows.net",
    )
    url = signed_ad_video_blob_url("lipsync-temp/1/run/video.mp4", expiry_hours=4)
    assert "testacct.blob.core.windows.net" in url
    assert "/ad-videos/lipsync-temp/1/run/video.mp4" in url
    assert "sig=" in url
