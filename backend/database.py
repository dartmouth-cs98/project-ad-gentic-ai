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


def _create_azure_ad_engine():
    # Imported here so the module loads fine without these packages installed
    # when using plain SQL auth instead.
    import struct
    import pyodbc
    from azure.identity import DefaultAzureCredential

    odbc_str = os.getenv("DB_ODBC_CONNECTION_STRING", "")
    if not odbc_str:
        raise RuntimeError("DB_ODBC_CONNECTION_STRING must be set when USE_AZURE_AD=true.")

    def creator():
        # Fetch a short-lived Azure AD access token for Azure SQL each time a
        # new connection is opened. This avoids storing any password and works
        # with the "Active Directory Default" / passwordless auth model.
        credential = DefaultAzureCredential()
        token = credential.get_token("https://database.windows.net/.default")

        # pyodbc expects the token as a UTF-16-LE byte string prefixed with a
        # 4-byte little-endian length — this is the format required by the
        # SQL_COPT_SS_ACCESS_TOKEN (1256) ODBC connection attribute.
        token_bytes = token.token.encode("utf-16-le")
        token_struct = struct.pack(f"<I{len(token_bytes)}s", len(token_bytes), token_bytes)
        return pyodbc.connect(odbc_str, attrs_before={1256: token_struct})

    # Use a blank URL and let the `creator` callable supply every connection,
    # bypassing SQLAlchemy's normal URL-based connection logic entirely.
    return create_engine("mssql+pyodbc://", creator=creator, pool_pre_ping=True, pool_recycle=300)


def _get_engine():
    global _engine
    if _engine is None:
        if os.getenv("USE_AZURE_AD") == "true":
            # Passwordless path: authenticate via Azure AD (requires `az login`
            # locally, or a managed identity in production).
            _engine = _create_azure_ad_engine()
        else:
            # Standard path: plain SQL username/password via a SQLAlchemy URL.
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
