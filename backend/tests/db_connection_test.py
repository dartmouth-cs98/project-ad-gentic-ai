"""
Test database connection. Run from project root or backend/:

    cd backend && python -m tests.db_connection_test
    # or
    python backend/tests/db_connection_test.py
"""

import sys
from pathlib import Path

# Ensure backend/ is on path and .env is loaded before importing database
_backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(_backend_dir))

from dotenv import load_dotenv
load_dotenv(_backend_dir / ".env")

from sqlalchemy import text
from database import get_engine, get_db


def test_engine_connection() -> bool:
    """Test that the engine can connect to the database."""
    try:
        with get_engine().connect() as conn:
            conn.execute(text("SELECT 1"))
        print("✓ Engine connection OK")
        return True
    except Exception as e:
        print(f"✗ Engine connection failed: {e}")
        return False


def test_session() -> bool:
    """Test that get_db yields a working session."""
    try:
        gen = get_db()
        db = next(gen)
        db.execute(text("SELECT 1"))
        try:
            next(gen)
        except StopIteration:
            pass
        print("✓ Session (get_db) OK")
        return True
    except Exception as e:
        print(f"✗ Session failed: {e}")
        return False


def main():
    print("Testing database connection...")
    results = [test_engine_connection(), test_session()]
    if all(results):
        print("\nAll tests passed.")
        sys.exit(0)
    else:
        print("\nSome tests failed.")
        sys.exit(1)


if __name__ == "__main__":
    main()
