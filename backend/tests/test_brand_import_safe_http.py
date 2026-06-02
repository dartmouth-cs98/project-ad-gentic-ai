"""Tests for SSRF-safe redirect handling."""

from __future__ import annotations

import ipaddress
from unittest.mock import MagicMock, patch

import pytest

from services.brand_import.safe_http import (
    ValidatingSyncNetworkBackend,
    _validate_redirect_target,
    brand_import_sync_http_client,
)
from services.brand_import.url_validation import BrandImportUrlError


def test_redirect_to_private_ip_rejected():
    response = MagicMock()
    response.status_code = 302
    response.url = "https://example.com/start"
    response.headers = {"location": "http://127.0.0.1/internal"}
    with pytest.raises(BrandImportUrlError, match="non-public|private|reserved"):
        _validate_redirect_target(response)


def test_redirect_to_public_https_allowed():
    response = MagicMock()
    response.status_code = 302
    response.url = "https://example.com/start"
    response.headers = {"location": "https://example.com/ok"}
    with patch(
        "services.brand_import.url_validation._resolve_hostname_ips",
        return_value=[ipaddress.ip_address("93.184.216.34")],
    ):
        _validate_redirect_target(response)


def test_non_redirect_skipped():
    response = MagicMock()
    response.status_code = 200
    _validate_redirect_target(response)


def test_sync_client_registers_redirect_validation_hook():
    client = brand_import_sync_http_client()
    try:
        hooks = client.event_hooks.get("response") or []
        assert _validate_redirect_target in hooks
        assert isinstance(client._transport._pool._network_backend, ValidatingSyncNetworkBackend)
    finally:
        client.close()
