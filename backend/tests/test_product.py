"""Unit tests for Product: model, schemas, CRUD, and routes.

Run from the backend directory:
    cd backend && python -m pytest tests/test_product.py -v
"""

import os
import sys
from datetime import datetime, timezone
from pathlib import Path

_backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(_backend_dir))

# Allow app to load when ALLOWED_ORIGINS is not set (e.g. CI)
os.environ.setdefault("ALLOWED_ORIGINS", "http://localhost")

import pytest
from pydantic import ValidationError
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from database import Base, get_db
from dependencies import get_current_client_id
from models.product import Product
from schemas.product import ProductCreate, ProductUpdate, ProductResponse
from crud.product import (
    get_product,
    get_products,
    create_product,
    update_product,
    delete_product,
)
from main import app

# ---------------------------------------------------------------------------
# Fixtures – in-memory SQLite for CRUD and route tests
# ---------------------------------------------------------------------------

FAKE_CLIENT_ID = 100

_original_schema = getattr(Product.__table__, "schema", None)

engine = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def _drop_schema_for_sqlite():
    """SQLite does not support schemas; temporarily clear so create_all works."""
    if hasattr(Product.__table__, "schema"):
        Product.__table__.schema = None


def _restore_schema():
    if _original_schema is not None:
        Product.__table__.schema = _original_schema


@pytest.fixture(autouse=True)
def setup_db():
    """Create the products table before each test and drop it after."""
    _drop_schema_for_sqlite()
    Base.metadata.create_all(bind=engine, tables=[Product.__table__])
    yield
    Base.metadata.drop_all(bind=engine, tables=[Product.__table__])
    _restore_schema()


@pytest.fixture
def db_session():
    """Yield a DB session for CRUD-only tests."""
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def client():
    """FastAPI TestClient with DB and auth overridden for route tests."""
    def _override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    def _override_get_current_client_id():
        return FAKE_CLIENT_ID

    app.dependency_overrides[get_db] = _override_get_db
    app.dependency_overrides[get_current_client_id] = _override_get_current_client_id
    yield TestClient(app)
    app.dependency_overrides.clear()


# ---------------------------------------------------------------------------
# Model tests
# ---------------------------------------------------------------------------


class TestProductModel:
    """Product SQLAlchemy model (no DB required for __repr__)."""

    def test_repr(self):
        product = Product(
            id=1,
            business_client_id=10,
            name="Test Product",
            description=None,
            image_url=None,
            product_link=None,
            product_metadata=None,
            is_active=True,
            created_at=None,
            updated_at=None,
            image_name=None,
        )
        assert repr(product) == "<Product(id=1, name='Test Product', business_client_id=10)>"


# ---------------------------------------------------------------------------
# Schema tests
# ---------------------------------------------------------------------------


class TestProductCreateSchema:
    """ProductCreate validation."""

    def test_valid_minimal(self):
        data = ProductCreate(name="Widget")
        assert data.name == "Widget"
        assert data.description is None
        assert data.is_active is None

    def test_valid_full(self):
        data = ProductCreate(
            name="Full Product",
            description="A description",
            image_url="https://example.com/img.png",
            image_name="img.png",
            product_link="https://example.com",
            product_metadata='{"key": "value"}',
            is_active=True,
        )
        assert data.name == "Full Product"
        assert data.description == "A description"
        assert data.is_active is True

    def test_rejects_empty_name(self):
        with pytest.raises(ValidationError):
            ProductCreate(name="")

    def test_rejects_missing_name(self):
        with pytest.raises(ValidationError):
            ProductCreate()


class TestProductUpdateSchema:
    """ProductUpdate validation – all fields optional."""

    def test_empty_update_valid(self):
        data = ProductUpdate()
        assert data.model_dump(exclude_unset=True) == {}

    def test_partial_update(self):
        data = ProductUpdate(description="Updated description", is_active=False)
        assert data.description == "Updated description"
        assert data.is_active is False
        assert data.name is None

    def test_rejects_empty_string_name_if_provided(self):
        with pytest.raises(ValidationError):
            ProductUpdate(name="")


class TestProductResponseSchema:
    """ProductResponse from_attributes (ORM -> response)."""

    def test_from_product_instance(self):
        now = datetime.now(timezone.utc)
        product = Product(
            id=5,
            business_client_id=20,
            name="Response Test",
            description="Desc",
            image_url=None,
            product_link="https://link.com",
            product_metadata='{"key": "value"}',
            is_active=True,
            created_at=now,
            updated_at=now,
            image_name="pic.png",
        )
        resp = ProductResponse.model_validate(product)
        assert resp.id == 5
        assert resp.business_client_id == 20
        assert resp.name == "Response Test"
        assert resp.description == "Desc"
        assert resp.product_link == "https://link.com"
        assert resp.product_metadata == '{"key": "value"}'
        assert resp.image_name == "pic.png"
        assert resp.is_active is True
        assert resp.created_at == now
        assert resp.updated_at == now


# ---------------------------------------------------------------------------
# CRUD tests
# ---------------------------------------------------------------------------


class TestProductCrud:
    """CRUD operations against in-memory SQLite."""

    def test_get_product_not_found(self, db_session):
        assert get_product(db_session, 999) is None

    def test_create_and_get_product(self, db_session):
        data = ProductCreate(name="CRUD Product", description="D")
        created = create_product(db_session, client_id=FAKE_CLIENT_ID, data=data)
        assert created.id is not None
        assert created.name == "CRUD Product"
        assert created.business_client_id == FAKE_CLIENT_ID

        found = get_product(db_session, created.id)
        assert found is not None
        assert found.name == created.name
        assert found.business_client_id == FAKE_CLIENT_ID

    def test_get_products_empty(self, db_session):
        result = get_products(db_session, business_client_id=FAKE_CLIENT_ID)
        assert result == []

    def test_get_products_filter_by_client(self, db_session):
        create_product(db_session, FAKE_CLIENT_ID, ProductCreate(name="Mine"))
        create_product(db_session, 999, ProductCreate(name="Theirs"))

        mine = get_products(db_session, business_client_id=FAKE_CLIENT_ID)
        assert len(mine) == 1
        assert mine[0].name == "Mine"

    def test_get_products_filter_by_is_active(self, db_session):
        create_product(db_session, FAKE_CLIENT_ID, ProductCreate(name="Active", is_active=True))
        create_product(db_session, FAKE_CLIENT_ID, ProductCreate(name="Inactive", is_active=False))

        active = get_products(db_session, business_client_id=FAKE_CLIENT_ID, is_active=True)
        assert len(active) == 1
        assert active[0].name == "Active"

    def test_get_products_pagination(self, db_session):
        for i in range(5):
            create_product(db_session, FAKE_CLIENT_ID, ProductCreate(name=f"Product {i}"))

        page1 = get_products(db_session, business_client_id=FAKE_CLIENT_ID, skip=0, limit=2)
        page2 = get_products(db_session, business_client_id=FAKE_CLIENT_ID, skip=2, limit=2)
        assert len(page1) == 2
        assert len(page2) == 2
        assert page1[0].name != page2[0].name

    def test_update_product(self, db_session):
        created = create_product(
            db_session, FAKE_CLIENT_ID, ProductCreate(name="Original", description="Old")
        )
        updated = update_product(
            db_session,
            created.id,
            ProductUpdate(name="Updated", description="New"),
        )
        assert updated is not None
        assert updated.name == "Updated"
        assert updated.description == "New"

    def test_update_product_partial(self, db_session):
        created = create_product(
            db_session, FAKE_CLIENT_ID, ProductCreate(name="Keep", description="Change me")
        )
        updated = update_product(db_session, created.id, ProductUpdate(description="Changed"))
        assert updated is not None
        assert updated.name == "Keep"
        assert updated.description == "Changed"

    def test_update_product_not_found(self, db_session):
        assert update_product(db_session, 99999, ProductUpdate(name="X")) is None

    def test_delete_product(self, db_session):
        created = create_product(db_session, FAKE_CLIENT_ID, ProductCreate(name="To Delete"))
        pid = created.id
        assert delete_product(db_session, pid) is True
        assert get_product(db_session, pid) is None

    def test_delete_product_not_found(self, db_session):
        assert delete_product(db_session, 99999) is False


# ---------------------------------------------------------------------------
# Route tests
# ---------------------------------------------------------------------------


def _create_product_via_api(client: TestClient, **overrides) -> dict:
    payload = {"name": "API Product", "description": "From API"}
    payload.update(overrides)
    resp = client.post("/products/", json=payload)
    assert resp.status_code == 201, resp.text
    return resp.json()


class TestProductRoutesList:
    """GET /products/"""

    def test_list_empty(self, client: TestClient):
        resp = client.get("/products/")
        assert resp.status_code == 200
        assert resp.json() == []

    def test_list_returns_created_products(self, client: TestClient):
        _create_product_via_api(client, name="First")
        _create_product_via_api(client, name="Second")
        resp = client.get("/products/")
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 2
        names = {p["name"] for p in data}
        assert names == {"First", "Second"}

    def test_list_filter_is_active(self, client: TestClient):
        _create_product_via_api(client, name="Active", is_active=True)
        _create_product_via_api(client, name="Inactive", is_active=False)
        resp = client.get("/products/", params={"is_active": True})
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 1
        assert data[0]["name"] == "Active"

    def test_list_pagination(self, client: TestClient):
        for i in range(4):
            _create_product_via_api(client, name=f"Paged-{i}")
        resp = client.get("/products/", params={"skip": 1, "limit": 2})
        assert resp.status_code == 200
        assert len(resp.json()) == 2

    def test_list_scoped_to_client(self, client: TestClient):
        _create_product_via_api(client, name="Mine")
        app.dependency_overrides[get_current_client_id] = lambda: 999
        resp = client.get("/products/")
        assert resp.status_code == 200
        assert resp.json() == []
        app.dependency_overrides[get_current_client_id] = lambda: FAKE_CLIENT_ID


class TestProductRoutesRead:
    """GET /products/{product_id}"""

    def test_read_found(self, client: TestClient):
        body = _create_product_via_api(client, name="Read Me")
        resp = client.get(f"/products/{body['id']}")
        assert resp.status_code == 200
        assert resp.json()["name"] == "Read Me"
        assert resp.json()["business_client_id"] == FAKE_CLIENT_ID

    def test_read_not_found(self, client: TestClient):
        resp = client.get("/products/99999")
        assert resp.status_code == 404
        assert resp.json()["detail"] == "Product not found"

    def test_read_other_client_returns_404(self, client: TestClient):
        body = _create_product_via_api(client, name="Mine")
        app.dependency_overrides[get_current_client_id] = lambda: 999
        resp = client.get(f"/products/{body['id']}")
        assert resp.status_code == 404
        app.dependency_overrides[get_current_client_id] = lambda: FAKE_CLIENT_ID


class TestProductRoutesCreate:
    """POST /products/"""

    def test_create_minimal(self, client: TestClient):
        body = _create_product_via_api(client, name="Minimal")
        assert body["name"] == "Minimal"
        assert body["business_client_id"] == FAKE_CLIENT_ID
        assert body["id"] is not None
        assert "created_at" in body

    def test_create_full(self, client: TestClient):
        payload = {
            "name": "Full",
            "description": "Desc",
            "image_url": "https://example.com/img.png",
            "image_name": "img.png",
            "product_link": "https://example.com",
            "product_metadata": "{}",
            "is_active": True,
        }
        resp = client.post("/products/", json=payload)
        assert resp.status_code == 201
        body = resp.json()
        assert body["name"] == "Full"
        assert body["description"] == "Desc"
        assert body["image_url"] == "https://example.com/img.png"
        assert body["product_metadata"] == "{}"
        assert body["is_active"] is True

    def test_create_rejects_empty_name(self, client: TestClient):
        resp = client.post("/products/", json={"name": ""})
        assert resp.status_code == 422

    def test_create_rejects_missing_name(self, client: TestClient):
        resp = client.post("/products/", json={})
        assert resp.status_code == 422


class TestProductRoutesUpdate:
    """PUT /products/{product_id}"""

    def test_update_success(self, client: TestClient):
        body = _create_product_via_api(client, name="Before")
        resp = client.put(f"/products/{body['id']}", json={"name": "After", "description": "New"})
        assert resp.status_code == 200
        assert resp.json()["name"] == "After"
        assert resp.json()["description"] == "New"

    def test_update_not_found(self, client: TestClient):
        resp = client.put("/products/99999", json={"name": "X"})
        assert resp.status_code == 404

    def test_update_other_client_returns_404(self, client: TestClient):
        body = _create_product_via_api(client, name="Mine")
        app.dependency_overrides[get_current_client_id] = lambda: 999
        resp = client.put(f"/products/{body['id']}", json={"name": "Hacked"})
        assert resp.status_code == 404
        app.dependency_overrides[get_current_client_id] = lambda: FAKE_CLIENT_ID

    def test_update_rejects_empty_name(self, client: TestClient):
        body = _create_product_via_api(client, name="Valid")
        resp = client.put(f"/products/{body['id']}", json={"name": ""})
        assert resp.status_code == 422


class TestProductRoutesDelete:
    """DELETE /products/{product_id}"""

    def test_delete_success(self, client: TestClient):
        body = _create_product_via_api(client, name="To Delete")
        resp = client.delete(f"/products/{body['id']}")
        assert resp.status_code == 204
        resp2 = client.get(f"/products/{body['id']}")
        assert resp2.status_code == 404

    def test_delete_not_found(self, client: TestClient):
        resp = client.delete("/products/99999")
        assert resp.status_code == 404

    def test_delete_other_client_returns_404(self, client: TestClient):
        body = _create_product_via_api(client, name="Mine")
        app.dependency_overrides[get_current_client_id] = lambda: 999
        resp = client.delete(f"/products/{body['id']}")
        assert resp.status_code == 404
        app.dependency_overrides[get_current_client_id] = lambda: FAKE_CLIENT_ID
        # Product still exists for owner
        resp2 = client.get(f"/products/{body['id']}")
        assert resp2.status_code == 200


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
