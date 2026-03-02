"""Tests for the /chat-messages endpoints — create, list, and clear.

Run from the backend directory:
    cd backend && python -m pytest tests/test_chat_messages.py -v
"""

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
from dependencies import get_current_client_id
from models.chat_message import ChatMessage
from main import app

# ---------------------------------------------------------------------------
# Fixtures – in-memory SQLite database + auth override
# ---------------------------------------------------------------------------

FAKE_CLIENT_ID = 42

_original_schema = ChatMessage.__table__.schema

engine = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(autouse=True)
def setup_db():
    """Create the chat_messages table before each test and drop it after."""
    ChatMessage.__table__.schema = None
    Base.metadata.create_all(bind=engine, tables=[ChatMessage.__table__])
    yield
    Base.metadata.drop_all(bind=engine, tables=[ChatMessage.__table__])
    ChatMessage.__table__.schema = _original_schema


@pytest.fixture()
def client():
    """Return a FastAPI TestClient with DB and auth dependencies overridden."""

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
# Helpers
# ---------------------------------------------------------------------------

def _create_message(client: TestClient, **overrides) -> dict:
    """POST a chat message with sensible defaults, return the JSON response."""
    payload = {
        "campaign_id": 1,
        "role": "user",
        "content": "Hello, world!",
        "message_type": "message",
    }
    payload.update(overrides)
    resp = client.post("/chat-messages/", json=payload)
    assert resp.status_code == 201, resp.text
    return resp.json()


# ---------------------------------------------------------------------------
# Tests — Create
# ---------------------------------------------------------------------------


class TestCreateChatMessage:
    """POST /chat-messages/"""

    def test_create_minimal(self, client: TestClient):
        body = _create_message(client)
        assert body["campaign_id"] == 1
        assert body["business_client_id"] == FAKE_CLIENT_ID
        assert body["role"] == "user"
        assert body["message_type"] == "message"
        assert body["content"] == "Hello, world!"
        assert body["version_ref"] is None
        assert "id" in body
        assert "timestamp" in body

    def test_create_with_version_ref(self, client: TestClient):
        body = _create_message(client, version_ref=5)
        assert body["version_ref"] == 5

    def test_create_plan_message(self, client: TestClient):
        body = _create_message(
            client, role="assistant", message_type="plan", content="Here is the plan..."
        )
        assert body["role"] == "assistant"
        assert body["message_type"] == "plan"

    def test_create_rejects_invalid_role(self, client: TestClient):
        resp = client.post("/chat-messages/", json={
            "campaign_id": 1,
            "role": "invalid_role",
            "content": "test",
        })
        assert resp.status_code == 422

    def test_create_rejects_invalid_message_type(self, client: TestClient):
        resp = client.post("/chat-messages/", json={
            "campaign_id": 1,
            "role": "user",
            "message_type": "invalid_type",
            "content": "test",
        })
        assert resp.status_code == 422

    def test_create_rejects_missing_content(self, client: TestClient):
        resp = client.post("/chat-messages/", json={
            "campaign_id": 1,
            "role": "user",
        })
        assert resp.status_code == 422

    def test_create_rejects_missing_campaign_id(self, client: TestClient):
        resp = client.post("/chat-messages/", json={
            "role": "user",
            "content": "test",
        })
        assert resp.status_code == 422


# ---------------------------------------------------------------------------
# Tests — List
# ---------------------------------------------------------------------------


class TestListChatMessages:
    """GET /chat-messages/?campaign_id=..."""

    def test_list_empty(self, client: TestClient):
        resp = client.get("/chat-messages/", params={"campaign_id": 1})
        assert resp.status_code == 200
        assert resp.json() == []

    def test_list_returns_created_messages(self, client: TestClient):
        _create_message(client, content="first")
        _create_message(client, content="second")

        resp = client.get("/chat-messages/", params={"campaign_id": 1})
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 2
        # Oldest-first ordering
        assert data[0]["content"] == "first"
        assert data[1]["content"] == "second"

    def test_list_filters_by_campaign(self, client: TestClient):
        _create_message(client, campaign_id=1, content="camp1")
        _create_message(client, campaign_id=2, content="camp2")

        resp = client.get("/chat-messages/", params={"campaign_id": 1})
        data = resp.json()
        assert len(data) == 1
        assert data[0]["content"] == "camp1"

    def test_list_requires_campaign_id(self, client: TestClient):
        resp = client.get("/chat-messages/")
        assert resp.status_code == 422

    def test_list_pagination(self, client: TestClient):
        for i in range(5):
            _create_message(client, content=f"msg-{i}")

        resp = client.get("/chat-messages/", params={"campaign_id": 1, "skip": 0, "limit": 2})
        assert len(resp.json()) == 2

        resp = client.get("/chat-messages/", params={"campaign_id": 1, "skip": 2, "limit": 10})
        assert len(resp.json()) == 3

    def test_list_scoped_to_client(self, client: TestClient):
        """Messages created by one client are not visible to another."""
        _create_message(client, content="my message")

        # Simulate a different client
        app.dependency_overrides[get_current_client_id] = lambda: 999

        resp = client.get("/chat-messages/", params={"campaign_id": 1})
        assert resp.status_code == 200
        assert resp.json() == []

        # Restore original override
        app.dependency_overrides[get_current_client_id] = lambda: FAKE_CLIENT_ID


# ---------------------------------------------------------------------------
# Tests — Delete (clear conversation)
# ---------------------------------------------------------------------------


class TestClearChatMessages:
    """DELETE /chat-messages/?campaign_id=..."""

    def test_clear_deletes_all_for_campaign(self, client: TestClient):
        _create_message(client, campaign_id=1, content="a")
        _create_message(client, campaign_id=1, content="b")
        _create_message(client, campaign_id=2, content="other campaign")

        resp = client.delete("/chat-messages/", params={"campaign_id": 1})
        assert resp.status_code == 204

        # Campaign 1 messages gone
        resp = client.get("/chat-messages/", params={"campaign_id": 1})
        assert resp.json() == []

        # Campaign 2 messages untouched
        resp = client.get("/chat-messages/", params={"campaign_id": 2})
        assert len(resp.json()) == 1

    def test_clear_returns_404_when_no_messages(self, client: TestClient):
        resp = client.delete("/chat-messages/", params={"campaign_id": 999})
        assert resp.status_code == 404

    def test_clear_requires_campaign_id(self, client: TestClient):
        resp = client.delete("/chat-messages/")
        assert resp.status_code == 422

    def test_clear_scoped_to_client(self, client: TestClient):
        """One client cannot delete another client's messages."""
        _create_message(client, content="my message")

        # Simulate a different client trying to delete
        app.dependency_overrides[get_current_client_id] = lambda: 999
        resp = client.delete("/chat-messages/", params={"campaign_id": 1})
        assert resp.status_code == 404

        # Restore and verify original messages still exist
        app.dependency_overrides[get_current_client_id] = lambda: FAKE_CLIENT_ID
        resp = client.get("/chat-messages/", params={"campaign_id": 1})
        assert len(resp.json()) == 1
