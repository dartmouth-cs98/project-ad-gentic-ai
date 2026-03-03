"""Batch processor for assigning personas to consumers."""

import json
import logging
from datetime import datetime, timezone

from openai import AsyncOpenAI
from pydantic import BaseModel
from sqlalchemy.orm import Session

from models.consumer import Consumer
from models.persona import Persona
from services.persona_assignment.service import assign_persona

logger = logging.getLogger(__name__)


class PersonaProcessingResult(BaseModel):
    """Summary of a batch processing run."""
    processed: int
    failed: int
    skipped: int       # already assigned
    low_confidence: int
    errors: list[str]


async def process_consumer_personas(
    db: Session,
    consumer_ids: list[int],
    openai_client: AsyncOpenAI,
) -> PersonaProcessingResult:
    """
    Assign personas to a batch of consumers.

    Skips consumers that already have a primary persona assigned (idempotent).
    Skips consumers with no traits data.
    """
    persona_lookup: dict[str, Persona] = {
        p.name: p for p in db.query(Persona).all()
    }

    result = PersonaProcessingResult(
        processed=0, failed=0, skipped=0, low_confidence=0, errors=[]
    )

    for consumer_id in consumer_ids:
        consumer = db.query(Consumer).filter(Consumer.id == consumer_id).first()

        if not consumer:
            result.failed += 1
            result.errors.append(f"Consumer {consumer_id}: not found")
            continue

        # Already assigned — skip
        if consumer.primary_persona_id is not None:
            result.skipped += 1
            continue

        if not consumer.traits:
            result.failed += 1
            result.errors.append(f"Consumer {consumer_id}: no traits data")
            continue

        try:
            traits_dict = json.loads(consumer.traits)
            assignment = await assign_persona(openai_client, traits_dict)

            primary = persona_lookup.get(assignment.primary_persona_name)
            if not primary:
                result.failed += 1
                result.errors.append(
                    f"Consumer {consumer_id}: unknown persona '{assignment.primary_persona_name}'"
                )
                continue

            consumer.primary_persona_id = primary.id
            consumer.persona_confidence = assignment.primary_confidence
            consumer.persona_assigned_at = datetime.now(timezone.utc)

            if assignment.primary_confidence < 0.5:
                result.low_confidence += 1

            if assignment.secondary_persona_name:
                secondary = persona_lookup.get(assignment.secondary_persona_name)
                if secondary:
                    consumer.secondary_persona_id = secondary.id

            db.add(consumer)
            result.processed += 1
            logger.info(
                "Consumer %d → '%s' (confidence=%.2f)",
                consumer_id,
                assignment.primary_persona_name,
                assignment.primary_confidence,
            )

        except Exception as exc:
            result.failed += 1
            result.errors.append(f"Consumer {consumer_id}: {exc}")
            logger.error("Failed to assign persona for consumer %d: %s", consumer_id, exc)

    try:
        db.commit()
    except Exception as exc:
        db.rollback()
        logger.error("Failed to commit persona assignments: %s", exc)
        raise

    return result
