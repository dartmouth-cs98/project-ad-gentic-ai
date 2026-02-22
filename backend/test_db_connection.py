"""Run this script to verify your local DB connection is working.

Usage:
    python test_db_connection.py
"""

from database import get_engine
from sqlalchemy import text

def test_connection():
    print("Testing database connection...")
    try:
        engine = get_engine()
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1 AS ok"))
            row = result.fetchone()
            print(f"DB connection successful: {row}")
    except Exception as e:
        print(f"DB connection failed: {e}")
        raise SystemExit(1)


if __name__ == "__main__":
    test_connection()
