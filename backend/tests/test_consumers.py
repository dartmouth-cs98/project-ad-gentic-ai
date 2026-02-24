"""Tests for the /consumers endpoints — CSV upload and list all.

Run from the backend directory:
    cd backend && python -m pytest tests/test_consumers.py -v
"""

import io
import sys
from pathlib import Path

# Ensure backend/ is on the Python path
_backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(_backend_dir))

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from database import Base, get_db
from models.consumer import Consumer
from main import app

# ---------------------------------------------------------------------------
# Fixtures – in-memory SQLite database
# ---------------------------------------------------------------------------

# Remove the "dbo" schema qualifier so SQLite can create the table.
Consumer.__table__.schema = None

engine = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(autouse=True)
def setup_db():
    """Create the consumers table before each test and drop it after."""
    Base.metadata.create_all(bind=engine, tables=[Consumer.__table__])
    yield
    Base.metadata.drop_all(bind=engine, tables=[Consumer.__table__])


@pytest.fixture()
def client():
    """Return a FastAPI TestClient with the DB dependency overridden."""

    def _override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = _override_get_db
    yield TestClient(app)
    app.dependency_overrides.clear()


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_csv(rows: list[str]) -> bytes:
    """Join rows into a UTF-8-encoded CSV bytestring."""
    return "\n".join(rows).encode("utf-8")


VALID_CSV_HEADER = "email,phone,first_name,last_name,traits"


# ---------------------------------------------------------------------------
# Tests — CSV Upload
# ---------------------------------------------------------------------------


class TestUploadCsv:
    """POST /consumers/upload-csv"""

    def test_upload_valid_csv(self, client: TestClient):
        csv_bytes = _make_csv([
            VALID_CSV_HEADER,
            'alice@example.com,555-0001,Alice,Smith,{"age": 30}',
            'bob@example.com,555-0002,Bob,Jones,{}',
        ])
        resp = client.post(
            "/consumers/upload-csv",
            files={"file": ("test.csv", io.BytesIO(csv_bytes), "text/csv")},
        )
        assert resp.status_code == 200
        body = resp.json()
        assert body["created"] == 2
        assert body["skipped"] == 0
        assert body["errors"] == []

    def test_upload_skips_duplicate_emails(self, client: TestClient):
        csv_bytes = _make_csv([
            VALID_CSV_HEADER,
            'dup@example.com,555-0001,Dup,One,{}',
            'dup@example.com,555-0002,Dup,Two,{}',
        ])
        resp = client.post(
            "/consumers/upload-csv",
            files={"file": ("dup.csv", io.BytesIO(csv_bytes), "text/csv")},
        )
        assert resp.status_code == 200
        body = resp.json()
        assert body["created"] == 1
        assert body["skipped"] == 1
        assert "dup@example.com" in body["skipped_emails"]

    def test_upload_skips_existing_db_emails(self, client: TestClient):
        # First upload
        csv1 = _make_csv([
            VALID_CSV_HEADER,
            'exists@example.com,555-0001,Ex,Isting,{}',
        ])
        client.post(
            "/consumers/upload-csv",
            files={"file": ("first.csv", io.BytesIO(csv1), "text/csv")},
        )

        # Second upload with same email
        csv2 = _make_csv([
            VALID_CSV_HEADER,
            'exists@example.com,555-9999,Ex,Again,{}',
            'new@example.com,555-0002,New,Person,{}',
        ])
        resp = client.post(
            "/consumers/upload-csv",
            files={"file": ("second.csv", io.BytesIO(csv2), "text/csv")},
        )
        assert resp.status_code == 200
        body = resp.json()
        assert body["created"] == 1
        assert body["skipped"] == 1

    def test_upload_rejects_non_csv(self, client: TestClient):
        resp = client.post(
            "/consumers/upload-csv",
            files={"file": ("data.txt", io.BytesIO(b"hello"), "text/plain")},
        )
        assert resp.status_code == 400
        assert "csv" in resp.json()["detail"].lower()

    def test_upload_rejects_missing_columns(self, client: TestClient):
        csv_bytes = _make_csv(["email,phone", "a@b.com,555-0001"])
        resp = client.post(
            "/consumers/upload-csv",
            files={"file": ("bad.csv", io.BytesIO(csv_bytes), "text/csv")},
        )
        assert resp.status_code == 400
        assert "columns" in resp.json()["detail"].lower()

    def test_upload_rejects_empty_csv(self, client: TestClient):
        csv_bytes = _make_csv([VALID_CSV_HEADER])
        resp = client.post(
            "/consumers/upload-csv",
            files={"file": ("empty.csv", io.BytesIO(csv_bytes), "text/csv")},
        )
        assert resp.status_code == 400
        assert "empty" in resp.json()["detail"].lower()

    def test_upload_reports_invalid_traits_json(self, client: TestClient):
        csv_bytes = _make_csv([
            VALID_CSV_HEADER,
            "bad@example.com,555-0001,Bad,Traits,NOT_JSON",
        ])
        resp = client.post(
            "/consumers/upload-csv",
            files={"file": ("bad_traits.csv", io.BytesIO(csv_bytes), "text/csv")},
        )
        assert resp.status_code == 200
        body = resp.json()
        assert body["created"] == 0
        assert len(body["errors"]) == 1
        assert "invalid JSON" in body["errors"][0]


# ---------------------------------------------------------------------------
# Tests — List Consumers
# ---------------------------------------------------------------------------


class TestListConsumers:
    """GET /consumers/"""

    def test_list_empty(self, client: TestClient):
        resp = client.get("/consumers/")
        assert resp.status_code == 200
        assert resp.json() == []

    def test_list_returns_uploaded_consumers(self, client: TestClient):
        csv_bytes = _make_csv([
            VALID_CSV_HEADER,
            'one@example.com,555-0001,One,User,{"color": "blue"}',
            'two@example.com,555-0002,Two,User,{}',
        ])
        client.post(
            "/consumers/upload-csv",
            files={"file": ("test.csv", io.BytesIO(csv_bytes), "text/csv")},
        )

        resp = client.get("/consumers/")
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 2
        emails = {c["email"] for c in data}
        assert emails == {"one@example.com", "two@example.com"}

    def test_list_pagination(self, client: TestClient):
        rows = [VALID_CSV_HEADER] + [
            f"user{i}@example.com,555-{i:04d},User,{i},{{}}" for i in range(5)
        ]
        csv_bytes = _make_csv(rows)
        client.post(
            "/consumers/upload-csv",
            files={"file": ("many.csv", io.BytesIO(csv_bytes), "text/csv")},
        )

        resp = client.get("/consumers/?skip=0&limit=2")
        assert resp.status_code == 200
        assert len(resp.json()) == 2

        resp = client.get("/consumers/?skip=2&limit=10")
        assert resp.status_code == 200
        assert len(resp.json()) == 3
