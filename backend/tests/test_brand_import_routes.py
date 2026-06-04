"""HTTP routes for /brand-import."""

import os
import sys
from pathlib import Path
from unittest.mock import AsyncMock, patch

import pytest

_backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(_backend_dir))

os.environ.setdefault("ALLOWED_ORIGINS", "http://localhost")

from fastapi.testclient import TestClient

from database import get_db
from dependencies import get_current_client_id
from main import app
from schemas.brand_import import BrandExtract, BrandImportPreview, ProductExtract

FAKE_CLIENT_ID = 42


@pytest.fixture
def client():
    app.dependency_overrides[get_current_client_id] = lambda: FAKE_CLIENT_ID
    app.dependency_overrides[get_db] = lambda: (_ for _ in ()).throw(RuntimeError("DB not used"))
    yield TestClient(app)
    app.dependency_overrides.clear()


def test_limits_endpoint(client):
    response = client.get("/brand-import/limits")
    assert response.status_code == 200
    body = response.json()
    assert "enabled" in body
    assert "remaining_analyzes_this_hour" in body


def test_analyze_returns_preview(client):
    preview = BrandImportPreview(
        source_url="https://example.com",
        fetched_pages=["https://example.com"],
        brand=BrandExtract(name="Example"),
        products=[ProductExtract(name="Widget")],
        warnings=[],
        confidence="high",
    )
    with patch(
        "routes.brand_import.analyze_business_url",
        new_callable=AsyncMock,
        return_value=preview,
    ):
        response = client.post("/brand-import/analyze", json={"url": "https://example.com"})
    assert response.status_code == 200
    assert response.json()["preview"]["brand"]["name"] == "Example"
