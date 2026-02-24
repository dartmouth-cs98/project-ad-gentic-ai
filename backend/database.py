import os
from pathlib import Path
from urllib.parse import quote_plus
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session, DeclarativeBase
from dotenv import load_dotenv
load_dotenv(Path(__file__).resolve().parent / ".env")


class Base(DeclarativeBase):
    """Base class for all SQLAlchemy models."""
    pass


def _build_url() -> str:
    raw = os.getenv("DB_CONNECTION_STRING", "")
    password = quote_plus(os.getenv("DB_PASSWORD", ""))
    return raw.replace("${DB_PASSWORD}", password)


# Lazy engine/session — only created when first needed, so imports
# won't crash in environments without DB credentials (e.g. CI).
_engine = None
_SessionLocal = None


def _get_engine():
    global _engine
    if _engine is None:
        url = _build_url()
        if not url:
            raise RuntimeError(
                "DB_CONNECTION_STRING is not set. "
                "Copy .env.example to .env and fill in your credentials."
            )
        _engine = create_engine(url, pool_pre_ping=True, pool_recycle=300)
    return _engine


def _get_session_factory():
    global _SessionLocal
    if _SessionLocal is None:
        _SessionLocal = sessionmaker(
            autocommit=False, autoflush=False, bind=_get_engine()
        )
    return _SessionLocal


def get_engine():
    """Public accessor for the engine (used by tests)."""
    return _get_engine()


def get_db():
    """FastAPI dependency that yields a database session per request."""
    factory = _get_session_factory()
    db: Session = factory()
    try:
        yield db
    finally:
        db.close()
