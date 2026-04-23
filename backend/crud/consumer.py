"""CRUD operations for consumers table."""

import json
from typing import Optional
from uuid import UUID

from sqlalchemy import or_, select
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

def get_consumer(
    db: Session,
    consumer_id: int,
) -> Optional[Consumer]:
    """Return a consumer by ID."""
    return db.get(Consumer, consumer_id)

def get_consumers_by_persona_id(
    db: Session,
    persona_id: str,
) -> list[Consumer]:
    """Return consumers whose primary persona matches the given persona ID (UUID string)."""
    return list(db.scalars(select(Consumer).where(Consumer.primary_persona_id == persona_id)).all())

def get_consumers(
    db: Session,
    client_id: int,
    skip: int = 0,
    limit: int = 100,
    persona_id: Optional[UUID] = None,
) -> list[Consumer]:
    """Return consumers for a client, optionally filtered by persona.

    persona_id matches consumers where primary OR secondary persona equals the given ID.
    """
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
    if persona_id is not None:
        pid = str(persona_id)
        query = query.where(
            or_(
                Consumer.primary_persona_id == pid,
                Consumer.secondary_persona_id == pid,
            )
        )
    return list(db.scalars(query).all())


def filter_owned_consumer_ids(db: Session, client_id: int, candidate_ids: list[int]) -> list[int]:
    """Return the subset of candidate_ids that belong to client_id."""
    query = select(Consumer.id).where(
        Consumer.id.in_(candidate_ids),
        Consumer.business_client_id == client_id,
    )
    return list(db.scalars(query).all())


def get_unassigned_consumer_ids(db: Session, client_id: int) -> list[int]:
    """Return IDs of all consumers for a client that have no primary persona assigned."""
    query = select(Consumer.id).where(
        Consumer.business_client_id == client_id,
        Consumer.primary_persona_id.is_(None),
    )
    return list(db.scalars(query).all())


def get_all_consumers(db: Session) -> list[Consumer]:
    """Return all consumers (no pagination)."""
    query = (
        select(Consumer)
        .order_by(Consumer.id)
    )
    return list(db.scalars(query).all())

def create_consumer(
    db: Session,
    client_id: int,
    data: ConsumerCreate,
    *,
    consumer_traits_description: str | None = None,
) -> Consumer:
    """Insert a new consumer and return it."""
    payload = data.model_dump()
    payload["business_client_id"] = client_id
    # Serialize traits dict to JSON string for the nvarchar column
    if payload.get("traits") is not None:
        payload["traits"] = json.dumps(payload["traits"])
    if consumer_traits_description is not None:
        payload["consumer_traits_description"] = consumer_traits_description
    consumer = Consumer(**payload)
    db.add(consumer)
    db.commit()
    db.refresh(consumer)
    return consumer


def create_consumers_bulk(
    db: Session,
    client_id: int,
    items: list[ConsumerCreate],
    *,
    consumer_traits_descriptions: list[str | None] | None = None,
) -> list[Consumer]:
    """Insert multiple consumers for a client in a single transaction and return them.

    When ``consumer_traits_descriptions`` is provided, it must be the same length as ``items``;
    each entry is persisted alongside the matching row (``None`` skips setting the column).
    """
    if consumer_traits_descriptions is not None and len(consumer_traits_descriptions) != len(items):
        raise ValueError("consumer_traits_descriptions must match items length")
    consumers = []
    for i, data in enumerate(items):
        payload = data.model_dump()
        payload["business_client_id"] = client_id
        if payload.get("traits") is not None:
            payload["traits"] = json.dumps(payload["traits"])
        if consumer_traits_descriptions is not None:
            desc = consumer_traits_descriptions[i]
            if desc is not None:
                payload["consumer_traits_description"] = desc
        consumers.append(Consumer(**payload))
    db.add_all(consumers)
    db.commit()
    for c in consumers:
        db.refresh(c)
    return consumers
