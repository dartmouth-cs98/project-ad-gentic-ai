"""URL validation and SSRF checks for brand import."""

import os
import sys
from pathlib import Path
from unittest.mock import patch

import pytest

_backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(_backend_dir))

from services.brand_import.url_validation import BrandImportUrlError, validate_public_http_url


def test_accepts_https_url_and_adds_scheme():
    with patch(
        "services.brand_import.url_validation._resolve_hostname_ips",
        return_value=[__import__("ipaddress").ip_address("93.184.216.34")],
    ):
        result = validate_public_http_url("https://example.com/about")
    assert result.hostname == "example.com"
    assert result.normalized.startswith("https://example.com")


def test_prepends_https_when_missing():
    with patch(
        "services.brand_import.url_validation._resolve_hostname_ips",
        return_value=[__import__("ipaddress").ip_address("93.184.216.34")],
    ):
        result = validate_public_http_url("example.com")
    assert result.normalized.startswith("https://example.com")


def test_rejects_localhost():
    with pytest.raises(BrandImportUrlError, match="not allowed"):
        validate_public_http_url("http://localhost/")


def test_rejects_private_ip_literal():
    with pytest.raises(BrandImportUrlError, match="non-public"):
        validate_public_http_url("http://127.0.0.1/")


def test_rejects_cgnat_shared_space_ip_literal():
    with pytest.raises(BrandImportUrlError, match="non-public"):
        validate_public_http_url("http://100.64.0.1/")


def test_rejects_private_resolved_ip():
    with patch(
        "services.brand_import.url_validation._resolve_hostname_ips",
        return_value=[__import__("ipaddress").ip_address("10.0.0.1")],
    ):
        with pytest.raises(BrandImportUrlError, match="non-public"):
            validate_public_http_url("https://evil.example.com")


def test_rejects_cgnat_shared_space_resolved_ip():
    with patch(
        "services.brand_import.url_validation._resolve_hostname_ips",
        return_value=[__import__("ipaddress").ip_address("100.64.0.1")],
    ):
        with pytest.raises(BrandImportUrlError, match="non-public"):
            validate_public_http_url("https://evil.example.com")
