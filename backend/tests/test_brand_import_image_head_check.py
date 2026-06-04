"""HEAD image probes use SSRF-safe URL validation and HTTP client."""

from __future__ import annotations

import ipaddress
from unittest.mock import MagicMock, patch

import httpx
import pytest

from services.brand_import.image_discovery import DiscoveredImage, filter_images_with_head_check
from services.brand_import.url_validation import BrandImportUrlError


def _public_ip_patch():
    return patch(
        "services.brand_import.url_validation._resolve_hostname_ips",
        return_value=[ipaddress.ip_address("93.184.216.34")],
    )


@pytest.mark.parametrize("url", ["http://127.0.0.1/photo.jpg", "http://localhost/logo.png"])
def test_head_check_drops_rejected_urls_without_http_call(url: str):
    images = [DiscoveredImage(url=url, source="img")]

    mock_client = MagicMock(spec=httpx.Client)
    mock_client.__enter__ = MagicMock(return_value=mock_client)
    mock_client.__exit__ = MagicMock(return_value=False)

    with patch(
        "services.brand_import.image_discovery.brand_import_image_head_check_enabled",
        return_value=True,
    ), patch(
        "services.brand_import.safe_http.brand_import_sync_http_client",
        return_value=mock_client,
    ):
        result = filter_images_with_head_check(images)

    assert result == []
    mock_client.head.assert_not_called()


def test_head_check_uses_validated_url_on_ssrf_safe_client():
    images = [
        DiscoveredImage(
            url="https://cdn.example.com/hero.jpg",
            source="img",
            width_hint=1200,
        )
    ]
    response = MagicMock(spec=httpx.Response)
    response.status_code = 200
    response.headers = {"content-type": "image/jpeg", "content-length": "50000"}

    mock_client = MagicMock(spec=httpx.Client)
    mock_client.head.return_value = response
    mock_client.__enter__ = MagicMock(return_value=mock_client)
    mock_client.__exit__ = MagicMock(return_value=False)

    with patch(
        "services.brand_import.image_discovery.brand_import_image_head_check_enabled",
        return_value=True,
    ), _public_ip_patch(), patch(
        "services.brand_import.safe_http.brand_import_sync_http_client",
        return_value=mock_client,
    ):
        result = filter_images_with_head_check(images)

    assert result == images
    mock_client.head.assert_called_once_with("https://cdn.example.com/hero.jpg")


def test_head_check_redirect_to_private_rejected():
    images = [DiscoveredImage(url="https://cdn.example.com/redirect-me.jpg", source="img")]

    redirect_response = MagicMock()
    redirect_response.status_code = 302
    redirect_response.url = "https://cdn.example.com/redirect-me.jpg"
    redirect_response.headers = {"location": "http://127.0.0.1/internal.jpg"}

    mock_client = MagicMock(spec=httpx.Client)
    mock_client.head.side_effect = BrandImportUrlError("URL resolves to a non-public address")
    mock_client.__enter__ = MagicMock(return_value=mock_client)
    mock_client.__exit__ = MagicMock(return_value=False)

    with patch(
        "services.brand_import.image_discovery.brand_import_image_head_check_enabled",
        return_value=True,
    ), _public_ip_patch(), patch(
        "services.brand_import.safe_http.brand_import_sync_http_client",
        return_value=mock_client,
    ):
        result = filter_images_with_head_check(images)

    assert result == []
    mock_client.head.assert_called_once()
