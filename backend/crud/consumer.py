"""CRUD operations for consumers table."""

import json
from typing import Optional

from sqlalchemy import select
from sqlalchemy.orm import Session

from models.consumer import Consumer
from schemas.consumer import ConsumerCreate


def get_existing_emails(db: Session, emails: list[str]) -> set[str]:
    """Return the subset of emails that already exist in the consumers table."""
    query = select(Consumer.email).where(Consumer.email.in_(emails))
    return set(db.scalars(query).all())


def get_consumers(
    db: Session,
    skip: int = 0,
    limit: int = 100,
) -> list[Consumer]:
    """Return a list of consumers."""
    query = select(Consumer).order_by(Consumer.id).offset(skip).limit(limit)
    return list(db.scalars(query).all())


def create_consumer(db: Session, data: ConsumerCreate) -> Consumer:
    """Insert a new consumer and return it."""
    payload = data.model_dump()
    # Serialize traits dict to JSON string for the nvarchar column
    if payload.get("traits") is not None:
        payload["traits"] = json.dumps(payload["traits"])
    consumer = Consumer(**payload)
    db.add(consumer)
    db.commit()
    db.refresh(consumer)
    return consumer
