"""Tests for Azure ad-video URL helpers (SAS + SSRF-safe download allowlist)."""

import pytest

from services.storage import ad_video_media_url as m


@pytest.fixture(autouse=True)
def clear_conn(monkeypatch):
    monkeypatch.delenv("AZURE_STORAGE_CONNECTION_STRING", raising=False)
    yield


def test_is_trusted_backend_download_false_without_connection_string(monkeypatch):
    url = "https://myacct.blob.core.windows.net/ad-videos/ad-videos/x.mp4"
    assert m.is_trusted_ad_video_backend_download_url(url) is False


def test_is_trusted_backend_download_true_when_host_and_container_match(monkeypatch):
    monkeypatch.setenv(
        "AZURE_STORAGE_CONNECTION_STRING",
        "AccountName=myacct;AccountKey=c2VjcmV0;EndpointSuffix=core.windows.net",
    )
    url = "https://myacct.blob.core.windows.net/ad-videos/ad-videos/x.mp4"
    assert m.is_trusted_ad_video_backend_download_url(url) is True


def test_is_trusted_backend_download_false_wrong_storage_account(monkeypatch):
    monkeypatch.setenv(
        "AZURE_STORAGE_CONNECTION_STRING",
        "AccountName=myacct;AccountKey=c2VjcmV0;EndpointSuffix=core.windows.net",
    )
    url = "https://other.blob.core.windows.net/ad-videos/ad-videos/x.mp4"
    assert m.is_trusted_ad_video_backend_download_url(url) is False


def test_is_trusted_backend_download_false_http(monkeypatch):
    monkeypatch.setenv(
        "AZURE_STORAGE_CONNECTION_STRING",
        "AccountName=myacct;AccountKey=c2VjcmV0;EndpointSuffix=core.windows.net",
    )
    url = "http://myacct.blob.core.windows.net/ad-videos/ad-videos/x.mp4"
    assert m.is_trusted_ad_video_backend_download_url(url) is False


def test_is_trusted_backend_download_false_wrong_container(monkeypatch):
    monkeypatch.setenv(
        "AZURE_STORAGE_CONNECTION_STRING",
        "AccountName=myacct;AccountKey=c2VjcmV0;EndpointSuffix=core.windows.net",
    )
    url = "https://myacct.blob.core.windows.net/other/x.mp4"
    assert m.is_trusted_ad_video_backend_download_url(url) is False


def test_is_trusted_backend_download_allows_query_sas(monkeypatch):
    monkeypatch.setenv(
        "AZURE_STORAGE_CONNECTION_STRING",
        "AccountName=myacct;AccountKey=c2VjcmV0;EndpointSuffix=core.windows.net",
    )
    url = "https://myacct.blob.core.windows.net/ad-videos/ad-videos/x.mp4?sv=2021&sig=abc"
    assert m.is_trusted_ad_video_backend_download_url(url) is True
