"""CRUD operations for personas table."""

from typing import Optional

from sqlalchemy import select
from sqlalchemy.orm import Session

from models.persona import Persona


def get_persona(db: Session, persona_id: str) -> Optional[Persona]:
    """Return a persona by ID, or None if not found."""
    return db.get(Persona, persona_id)


def get_personas(
    db: Session,
    skip: int = 0,
    limit: int = 100,
) -> list[Persona]:
    """Return personas ordered by name, with optional pagination."""
    query = (
        select(Persona)
        .order_by(Persona.name)
        .offset(skip)
        .limit(limit)
    )
    return list(db.scalars(query).all())
