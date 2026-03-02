"""CRUD operations for consumers table."""

import json
from typing import Optional

from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from models.consumer import Consumer
from schemas.consumer import ConsumerCreate


def get_existing_emails(db: Session, client_id: int, emails: list[str]) -> set[str]:
    """Return the subset of emails that already exist in the consumers table for this client."""
    query = select(Consumer.email).where(
        Consumer.business_client_id == client_id,
        Consumer.email.in_(emails)
    )
    return set(db.scalars(query).all())


def get_consumers(
    db: Session,
    client_id: int,
    skip: int = 0,
    limit: int = 100,
) -> list[Consumer]:
    """Return a list of consumers for a specific client."""
    query = (
        select(Consumer)
        .where(Consumer.business_client_id == client_id)
        .options(
            joinedload(Consumer.primary_persona),
            joinedload(Consumer.secondary_persona),
        )
        .order_by(Consumer.id)
        .offset(skip)
        .limit(limit)
    )
    return list(db.scalars(query).all())


def create_consumer(db: Session, client_id: int, data: ConsumerCreate) -> Consumer:
    """Insert a new consumer and return it."""
    payload = data.model_dump()
    payload["business_client_id"] = client_id
    # Serialize traits dict to JSON string for the nvarchar column
    if payload.get("traits") is not None:
        payload["traits"] = json.dumps(payload["traits"])
    consumer = Consumer(**payload)
    db.add(consumer)
    db.commit()
    db.refresh(consumer)
    return consumer


def create_consumers_bulk(db: Session, client_id: int, items: list[ConsumerCreate]) -> list[Consumer]:
    """Insert multiple consumers for a client in a single transaction and return them."""
    consumers = []
    for data in items:
        payload = data.model_dump()
        payload["business_client_id"] = client_id
        if payload.get("traits") is not None:
            payload["traits"] = json.dumps(payload["traits"])
        consumers.append(Consumer(**payload))
    db.add_all(consumers)
    db.commit()
    for c in consumers:
        db.refresh(c)
    return consumers
