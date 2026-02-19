import os
from urllib.parse import quote_plus
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session, DeclarativeBase
from dotenv import load_dotenv
load_dotenv()


class Base(DeclarativeBase):
    """Base class for all SQLAlchemy models."""
    pass

_db_url = os.getenv("DB_CONNECTION_STRING", "").replace(
    "${DB_PASSWORD}", quote_plus(os.getenv("DB_PASSWORD", ""))
)
DATABASE_URL = _db_url

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=300,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    """FastAPI dependency that yields a database session per request."""
    db: Session = SessionLocal()
    try:
        yield db
    finally:
        db.close()
