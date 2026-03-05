"""Batch processor for assigning personas to consumers."""

import asyncio
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

_MAX_CONCURRENT_LLM_CALLS = 10


class PersonaProcessingResult(BaseModel):
    """Summary of a batch processing run."""
    processed: int
    failed: int
    skipped: int       # already assigned
    low_confidence: int
    errors: list[str]


async def _process_one(
    consumer: Consumer,
    persona_lookup: dict[str, Persona],
    personas: list[Persona],
    openai_client: AsyncOpenAI,
    semaphore: asyncio.Semaphore,
) -> dict:
    """Process a single consumer and return a result dict.

    Never raises — all errors are captured and returned in the result.
    """
    if consumer.primary_persona_id is not None:
        return {"status": "skipped"}

    if not consumer.traits:
        return {
            "status": "failed",
            "error": f"Consumer {consumer.id}: no traits data",
        }

    try:
        traits_dict = json.loads(consumer.traits)
        async with semaphore:
            assignment = await assign_persona(openai_client, traits_dict, personas)

        primary = persona_lookup.get(assignment.primary_persona_name)
        if not primary:
            return {
                "status": "failed",
                "error": f"Consumer {consumer.id}: unknown persona '{assignment.primary_persona_name}'",
            }

        consumer.primary_persona_id = primary.id
        consumer.persona_confidence = assignment.primary_confidence
        consumer.persona_assigned_at = datetime.now(timezone.utc)

        if assignment.secondary_persona_name:
            secondary = persona_lookup.get(assignment.secondary_persona_name)
            if secondary:
                consumer.secondary_persona_id = secondary.id

        logger.info(
            "Consumer %d → '%s' (confidence=%.2f)",
            consumer.id,
            assignment.primary_persona_name,
            assignment.primary_confidence,
        )
        return {
            "status": "processed",
            "low_confidence": assignment.primary_confidence < 0.5,
        }

    except Exception as exc:
        logger.error("Failed to assign persona for consumer %d: %s", consumer.id, exc)
        return {
            "status": "failed",
            "error": f"Consumer {consumer.id}: {exc}",
        }


async def process_consumer_personas(
    db: Session,
    consumer_ids: list[int],
    openai_client: AsyncOpenAI,
) -> PersonaProcessingResult:
    """Assign personas to a batch of consumers concurrently.

    - Skips consumers that already have a primary persona assigned (idempotent).
    - Treats consumers with no traits data as failures and records them in the result.
    - Up to _MAX_CONCURRENT_LLM_CALLS LLM calls run in parallel.
    - A single db.commit() is issued after all processing completes.
    """
    personas: list[Persona] = db.query(Persona).all()
    persona_lookup: dict[str, Persona] = {p.name: p for p in personas}

    consumers: list[Consumer] = (
        db.query(Consumer).filter(Consumer.id.in_(consumer_ids)).all()
    )
    found_ids = {c.id for c in consumers}

    result = PersonaProcessingResult(
        processed=0, failed=0, skipped=0, low_confidence=0, errors=[]
    )

    # Count IDs that don't exist in the DB up front
    for cid in consumer_ids:
        if cid not in found_ids:
            result.failed += 1
            result.errors.append(f"Consumer {cid}: not found")

    if not consumers:
        return result

    semaphore = asyncio.Semaphore(_MAX_CONCURRENT_LLM_CALLS)
    outcomes = await asyncio.gather(
        *[
            _process_one(consumer, persona_lookup, personas, openai_client, semaphore)
            for consumer in consumers
        ]
    )

    for outcome in outcomes:
        status = outcome["status"]
        if status == "processed":
            result.processed += 1
            if outcome.get("low_confidence"):
                result.low_confidence += 1
        elif status == "skipped":
            result.skipped += 1
        else:
            result.failed += 1
            result.errors.append(outcome["error"])

    try:
        db.add_all(consumers)
        db.commit()
    except Exception as exc:
        db.rollback()
        logger.error("Failed to commit persona assignments: %s", exc)
        raise

    return result
