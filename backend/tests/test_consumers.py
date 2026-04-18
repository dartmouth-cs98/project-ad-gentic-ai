"""Tests for the /consumers endpoints — CSV upload and list all.

Run from the backend directory:
    cd backend && python -m pytest tests/test_consumers.py -v
"""

import io
import json
import sys
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4

# Ensure backend/ is on the Python path
_backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(_backend_dir))

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from database import Base, get_db
from dependencies import get_current_client_id
from models.consumer import Consumer
from models.persona import Persona
from services.consumer_persona_processor.service import PersonaProcessingResult
from main import app

_TEST_CLIENT_ID = 1

# ---------------------------------------------------------------------------
# Fixtures – in-memory SQLite database
# ---------------------------------------------------------------------------

# Save original schemas so we can restore them after each test.
_consumer_original_schema = Consumer.__table__.schema
_persona_original_schema = Persona.__table__.schema

engine = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
    query_cache_size=0,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(autouse=True)
def setup_db():
    """Create Persona + Consumer tables before each test and drop after."""
    # SQLite doesn't support schemas — temporarily remove the "dbo" qualifier.
    Persona.__table__.schema = None
    Consumer.__table__.schema = None
    # Persona must be created first — Consumer FKs reference it.
    Base.metadata.create_all(bind=engine, tables=[Persona.__table__, Consumer.__table__])
    yield
    Base.metadata.drop_all(bind=engine, tables=[Consumer.__table__, Persona.__table__])
    # Restore original schemas.
    Persona.__table__.schema = _persona_original_schema
    Consumer.__table__.schema = _consumer_original_schema


@pytest.fixture(autouse=True)
def _mock_traits_description_llm():
    """Stub Grok client + description so tests pass without SCRIPT_* (e.g. GitHub Actions).

    CSV upload calls ``get_script_llm_client_and_model()`` before ``generate_*``; CI has no
    SCRIPT_API_KEY / SCRIPT_BASE_URL / SCRIPT_MODEL, so that call must be mocked too.
    """
    mock_http = MagicMock()
    with (
        patch(
            "routes.consumers.get_script_llm_client_and_model",
            return_value=(mock_http, "stub-model"),
        ),
        patch(
            "routes.consumers.generate_consumer_traits_description",
            new_callable=AsyncMock,
            return_value="Stub audience description for tests.",
        ),
    ):
        yield


@pytest.fixture()
def client():
    """Return a FastAPI TestClient with DB and auth dependencies overridden."""

    def _override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = _override_get_db
    app.dependency_overrides[get_current_client_id] = lambda: _TEST_CLIENT_ID
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
        for row in data:
            assert row.get("consumer_traits_description") == "Stub audience description for tests."

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


# ---------------------------------------------------------------------------
# Helpers — persona seed data
# ---------------------------------------------------------------------------

def _seed_persona(name: str) -> Persona:
    """Build (but do not persist) a Persona ORM row."""
    return Persona(
        id=str(uuid4()),
        name=name,
        description=f"{name} description",
        key_motivators=json.dumps(["Efficiency"]),
        pain_points=json.dumps(["Waste"]),
        ad_tone_preferences=None,
    )


# ---------------------------------------------------------------------------
# Tests — POST /consumers/assign-personas
# ---------------------------------------------------------------------------


class TestAssignPersonas:
    """POST /consumers/assign-personas"""

    def test_no_unassigned_consumers_returns_zeros(self, client: TestClient):
        """When there are no unassigned consumers the endpoint short-circuits without LLM calls."""
        resp = client.post("/consumers/assign-personas", json={})
        assert resp.status_code == 200
        body = resp.json()
        assert body == {"processed": 0, "failed": 0, "skipped": 0, "low_confidence": 0, "errors": []}

    def test_assign_with_specific_ids_calls_processor(self, client: TestClient):
        """Passing explicit consumer_ids delegates to the processor for owned consumers."""
        csv_bytes = _make_csv([
            VALID_CSV_HEADER,
            'c1@example.com,555-0001,C,One,{"age": 25}',
            'c2@example.com,555-0002,C,Two,{"age": 30}',
        ])
        client.post(
            "/consumers/upload-csv",
            files={"file": ("seed.csv", io.BytesIO(csv_bytes), "text/csv")},
        )
        ids = [c["id"] for c in client.get("/consumers/").json()]

        mock_result = PersonaProcessingResult(
            processed=2, failed=0, skipped=0, low_confidence=0, errors=[]
        )
        with patch("routes.consumers.get_openai_client"), patch(
            "routes.consumers.process_consumer_personas",
            new=AsyncMock(return_value=mock_result),
        ):
            resp = client.post("/consumers/assign-personas", json={"consumer_ids": ids})

        assert resp.status_code == 200
        body = resp.json()
        assert body["processed"] == 2
        assert body["failed"] == 0

    def test_assign_with_foreign_consumer_ids_returns_403(self, client: TestClient):
        """consumer_ids that belong to another client must be rejected with 403."""
        resp = client.post("/consumers/assign-personas", json={"consumer_ids": [99998, 99999]})
        assert resp.status_code == 403

    def test_assign_without_ids_processes_all_unassigned(self, client: TestClient):
        """Omitting consumer_ids fetches all unassigned consumers for the client."""
        # Create two consumers without personas
        csv_bytes = _make_csv([
            VALID_CSV_HEADER,
            'unassigned1@example.com,555-0001,Un,Assigned,{"age": 25}',
            'unassigned2@example.com,555-0002,Un,Assigned2,{"age": 30}',
        ])
        client.post(
            "/consumers/upload-csv",
            files={"file": ("test.csv", io.BytesIO(csv_bytes), "text/csv")},
        )

        mock_result = PersonaProcessingResult(
            processed=2, failed=0, skipped=0, low_confidence=0, errors=[]
        )
        with patch("routes.consumers.get_openai_client"), patch(
            "routes.consumers.process_consumer_personas",
            new=AsyncMock(return_value=mock_result),
        ) as mock_proc:
            resp = client.post("/consumers/assign-personas", json={})

        assert resp.status_code == 200
        # Processor must have been called with both consumer IDs
        called_ids = mock_proc.call_args[0][1]
        assert len(called_ids) == 2

    def test_assign_skips_already_assigned_consumers(self, client: TestClient):
        """Consumers with an existing primary persona are excluded from the processor call."""
        db_session = TestingSessionLocal()
        persona = _seed_persona("Pragmatic Optimizer")
        db_session.add(persona)
        db_session.commit()
        db_session.refresh(persona)

        # One assigned, one unassigned
        csv_bytes = _make_csv([
            VALID_CSV_HEADER,
            'assigned@example.com,555-0001,Al,Ready,{"age": 25}',
            'pending@example.com,555-0002,Pen,Ding,{"age": 30}',
        ])
        client.post(
            "/consumers/upload-csv",
            files={"file": ("test.csv", io.BytesIO(csv_bytes), "text/csv")},
        )

        # Manually set primary_persona on the first consumer
        from models.consumer import Consumer as C
        assigned = db_session.query(C).filter(C.email == "assigned@example.com").first()
        assigned.primary_persona_id = persona.id
        db_session.commit()
        db_session.close()

        mock_result = PersonaProcessingResult(
            processed=1, failed=0, skipped=0, low_confidence=0, errors=[]
        )
        with patch("routes.consumers.get_openai_client"), patch(
            "routes.consumers.process_consumer_personas",
            new=AsyncMock(return_value=mock_result),
        ) as mock_proc:
            resp = client.post("/consumers/assign-personas", json={})

        assert resp.status_code == 200
        called_ids = mock_proc.call_args[0][1]
        assert len(called_ids) == 1  # only the unassigned one


# ---------------------------------------------------------------------------
# Tests — GET /consumers/?persona_id=
# ---------------------------------------------------------------------------


class TestFilterByPersona:
    """GET /consumers/?persona_id=<uuid>"""

    def _seed_consumers_with_personas(self, client: TestClient):
        """Upload two consumers, then manually assign personas to them."""
        csv_bytes = _make_csv([
            VALID_CSV_HEADER,
            'primary@example.com,555-0001,Pri,Mary,{"age": 25}',
            'secondary@example.com,555-0002,Sec,Ondary,{"age": 30}',
            'nopersona@example.com,555-0003,No,Persona,{"age": 35}',
        ])
        client.post(
            "/consumers/upload-csv",
            files={"file": ("test.csv", io.BytesIO(csv_bytes), "text/csv")},
        )

        db_session = TestingSessionLocal()
        persona_a = _seed_persona("Pragmatic Optimizer")
        persona_b = _seed_persona("Aspiring Achiever")
        # Capture IDs before adding — we generated them with uuid4() so no refresh needed.
        pid_a = persona_a.id
        pid_b = persona_b.id
        db_session.add(persona_a)
        db_session.add(persona_b)
        db_session.commit()

        from models.consumer import Consumer as C
        c1 = db_session.query(C).filter(C.email == "primary@example.com").first()
        c1.primary_persona_id = pid_a

        c2 = db_session.query(C).filter(C.email == "secondary@example.com").first()
        c2.secondary_persona_id = pid_b

        db_session.commit()
        db_session.close()
        return pid_a, pid_b

    def test_filter_by_primary_persona_returns_matching_consumer(self, client: TestClient):
        persona_a_id, _ = self._seed_consumers_with_personas(client)

        resp = client.get(f"/consumers/?persona_id={persona_a_id}")
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 1
        assert data[0]["email"] == "primary@example.com"

    def test_filter_by_secondary_persona_returns_matching_consumer(self, client: TestClient):
        _, persona_b_id = self._seed_consumers_with_personas(client)

        resp = client.get(f"/consumers/?persona_id={persona_b_id}")
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 1
        assert data[0]["email"] == "secondary@example.com"

    def test_filter_with_unknown_persona_id_returns_empty(self, client: TestClient):
        self._seed_consumers_with_personas(client)

        resp = client.get(f"/consumers/?persona_id={uuid4()}")
        assert resp.status_code == 200
        assert resp.json() == []

    def test_no_filter_returns_all_consumers(self, client: TestClient):
        self._seed_consumers_with_personas(client)

        resp = client.get("/consumers/")
        assert resp.status_code == 200
        assert len(resp.json()) == 3


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
