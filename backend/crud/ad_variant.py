"""CRUD operations for ad_variants table."""

from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import select
from sqlalchemy.orm import Session

from models.ad_variant import AdVariant
from models.consumer import Consumer
from models.persona import Persona
from schemas.ad_variant import AdVariantCreate, AdVariantUpdate


def get_ad_variants(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    campaign_id: Optional[int] = None,
    version_number: Optional[int] = None,
    status: Optional[str] = None,
    is_preview: Optional[bool] = None,
) -> list[AdVariant]:
    """Return a list of ad variants with optional filters."""
    query = select(AdVariant)
    if campaign_id is not None:
        query = query.where(AdVariant.campaign_id == campaign_id)
    if version_number is not None:
        query = query.where(AdVariant.version_number == version_number)
    if status is not None:
        query = query.where(AdVariant.status == status)
    if is_preview is not None:
        query = query.where(AdVariant.is_preview == is_preview)
    query = query.order_by(AdVariant.id).offset(skip).limit(limit)
    return list(db.scalars(query).all())


def get_ad_variant_by_campaign_consumer_version(
    db: Session,
    campaign_id: int,
    consumer_id: int,
    version_number: int,
) -> Optional[AdVariant]:
    """Return the ad variant for this campaign/consumer/version, or None if not found."""
    query = (
        select(AdVariant)
        .where(AdVariant.campaign_id == campaign_id)
        .where(AdVariant.consumer_id == consumer_id)
        .where(AdVariant.version_number == version_number)
    )
    return db.scalars(query).first()


def get_ad_variant(db: Session, ad_variant_id: int) -> Optional[AdVariant]:
    """Return a single ad variant by ID, or None."""
    return db.get(AdVariant, ad_variant_id)


def create_ad_variant(db: Session, data: AdVariantCreate) -> AdVariant:
    """Insert a new ad variant and return it."""
    ad_variant = AdVariant(**data.model_dump())
    db.add(ad_variant)
    db.commit()
    db.refresh(ad_variant)
    return ad_variant


def update_ad_variant(
    db: Session, ad_variant_id: int, data: AdVariantUpdate
) -> Optional[AdVariant]:
    """Update an existing ad variant. Returns None if not found."""
    ad_variant = db.get(AdVariant, ad_variant_id)
    if ad_variant is None:
        return None
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(ad_variant, field, value)
    ad_variant.updated_at = datetime.now(timezone.utc)
    db.commit()
    # Omit refresh(): extra SELECT can fail on flaky connections after a successful commit.
    return ad_variant


def delete_ad_variant(db: Session, ad_variant_id: int) -> bool:
    """Delete an ad variant by ID. Returns True if deleted, False if not found."""
    ad_variant = db.get(AdVariant, ad_variant_id)
    if ad_variant is None:
        return False
    db.delete(ad_variant)
    db.commit()
    return True


def attach_personas(db: Session, variants: list[AdVariant]) -> None:
    """Set ``persona_id`` and ``persona_name`` instance attributes on each variant.

    Resolves the chain ``AdVariant.consumer_id → Consumer.primary_persona_id →
    Persona`` in a single batched query (one SELECT regardless of list size).
    Variants with no consumer or whose consumer has no primary persona get
    ``persona_id = persona_name = None``.

    Mutates the variants in-place; consumed by the response serializer via
    ``model_validate(..., from_attributes=True)``.
    """
    for v in variants:
        v.persona_id = None
        v.persona_name = None

    consumer_ids = {v.consumer_id for v in variants if v.consumer_id is not None}
    if not consumer_ids:
        return

    rows = db.execute(
        select(Consumer.id, Persona.id, Persona.name)
        .outerjoin(Persona, Consumer.primary_persona_id == Persona.id)
        .where(Consumer.id.in_(consumer_ids))
    ).all()
    persona_by_consumer = {cid: (pid, pname) for cid, pid, pname in rows}

    for v in variants:
        if v.consumer_id in persona_by_consumer:
            pid, pname = persona_by_consumer[v.consumer_id]
            v.persona_id = pid
            v.persona_name = pname
