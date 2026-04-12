"""Batch processor for assigning personas to consumers.

Assignment strategy (in order):
  1. GMM batch — vectorize all eligible consumers, fit once, assign.
     Consumers with confidence >= GMM_CONFIDENCE_THRESHOLD are done.
  2. LLM fallback — remaining consumers (low confidence, GMM persona not
     in DB, or batch too small) go through the original LLM path.

Thresholds:
  GMM_CONFIDENCE_THRESHOLD  — minimum GMM confidence to accept without LLM. 
  Must stay in sync with LOW_CONFIDENCE_MARK in gmm_persona_assignment/service.py.
"""

import asyncio
import json
import logging
from datetime import datetime, timezone
from decimal import Decimal

import numpy as np
from openai import AsyncOpenAI
from pydantic import BaseModel
from sqlalchemy.orm import Session

from models.consumer import Consumer
from models.persona import Persona
from services.gmm_persona_assignment.model import MIN_SAMPLES, fit_and_predict
from services.gmm_persona_assignment.seeds import PERSONA_NAMES
from services.gmm_persona_assignment.vectorizer import encode_traits
from services.persona_assignment.service import assign_persona

logger = logging.getLogger(__name__)

_MAX_CONCURRENT_LLM_CALLS = 10
GMM_CONFIDENCE_THRESHOLD = 0.60


class PersonaProcessingResult(BaseModel):
    """Summary of a batch processing run."""
    processed: int
    failed: int
    skipped: int # already assigned
    low_confidence: int # LLM assignments below 0.5 confidence
    gmm_assigned: int = 0 # consumers assigned by GMM (confidence >= threshold)
    errors: list[str]


async def _process_one(
    consumer: Consumer,
    persona_lookup: dict[str, Persona],
    personas: list[Persona],
    openai_client: AsyncOpenAI,
    semaphore: asyncio.Semaphore,
) -> dict:
    """LLM assignment for a single consumer. Never raises."""
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
        consumer.persona_confidence = Decimal(str(assignment.primary_confidence))
        consumer.persona_assigned_at = datetime.now(timezone.utc)

        if assignment.secondary_persona_name:
            secondary = persona_lookup.get(assignment.secondary_persona_name)
            if secondary:
                consumer.secondary_persona_id = secondary.id

        logger.info(
            "Consumer %d → '%s' via LLM (confidence=%.2f)",
            consumer.id,
            assignment.primary_persona_name,
            assignment.primary_confidence,
        )
        return {
            "status": "processed",
            "low_confidence": assignment.primary_confidence < 0.5,
        }

    except Exception as exc:
        logger.error("LLM failed for consumer %d: %s", consumer.id, exc)
        return {
            "status": "failed",
            "error": f"Consumer {consumer.id}: {exc}",
        }


async def process_consumer_personas(
    db: Session,
    consumer_ids: list[int],
    openai_client: AsyncOpenAI,
) -> PersonaProcessingResult:
    """Assign personas to a batch of consumers.

    Runs GMM first; consumers with confidence < GMM_CONFIDENCE_THRESHOLD
    (or when GMM cannot run) fall back to the LLM path.

    - Skips consumers that already have a primary persona (idempotent).
    - A single db.commit() is issued after all processing completes.
    """
    personas: list[Persona] = db.query(Persona).all()
    persona_lookup: dict[str, Persona] = {p.name: p for p in personas}

    consumers: list[Consumer] = (
        db.query(Consumer).filter(Consumer.id.in_(consumer_ids)).all()
    )
    found_ids = {c.id for c in consumers}

    result = PersonaProcessingResult(
        processed=0, failed=0, skipped=0, low_confidence=0, gmm_assigned=0, errors=[]
    )

    for cid in consumer_ids:
        if cid not in found_ids:
            result.failed += 1
            result.errors.append(f"Consumer {cid}: not found")

    if not consumers:
        return result

    # --- pre-classify ---
    already_assigned = [c for c in consumers if c.primary_persona_id is not None]
    eligible = [c for c in consumers if c.primary_persona_id is None]
    no_traits = [c for c in eligible if not c.traits]
    vectorizable = [c for c in eligible if c.traits]

    result.skipped += len(already_assigned)

    for consumer in no_traits:
        result.failed += 1
        result.errors.append(f"Consumer {consumer.id}: no traits data")

    # --- GMM batch pass ---
    llm_candidates: list[Consumer] = []

    if len(vectorizable) >= MIN_SAMPLES:
        try:
            X = np.stack([encode_traits(json.loads(c.traits or "{}")) for c in vectorizable])
            proba, _ = fit_and_predict(X)
            now = datetime.now(timezone.utc)

            for i, consumer in enumerate(vectorizable):
                confidence = float(np.max(proba[i]))

                if confidence < GMM_CONFIDENCE_THRESHOLD:
                    llm_candidates.append(consumer)
                    continue

                component_idx = int(np.argmax(proba[i]))
                persona_name = PERSONA_NAMES[component_idx]
                primary = persona_lookup.get(persona_name)

                if primary is None:
                    # Persona not seeded into this DB — fall through to LLM.
                    llm_candidates.append(consumer)
                    continue

                consumer.primary_persona_id = primary.id
                consumer.persona_confidence = Decimal(str(confidence))
                consumer.persona_assigned_at = now

                sorted_idx = np.argsort(proba[i])[::-1]
                if len(sorted_idx) > 1 and proba[i][sorted_idx[1]] >= 0.25:
                    secondary_name = PERSONA_NAMES[sorted_idx[1]]
                    secondary = persona_lookup.get(secondary_name)
                    if secondary:
                        consumer.secondary_persona_id = secondary.id

                result.processed += 1
                result.gmm_assigned += 1
                logger.info(
                    "Consumer %d → '%s' via GMM (confidence=%.2f)",
                    consumer.id,
                    persona_name,
                    confidence,
                )

        except Exception as exc:
            logger.error("GMM batch failed: %s — routing all to LLM", exc)
            llm_candidates = vectorizable
    else:
        # Too few consumers to fit GMM — go straight to LLM.
        llm_candidates = vectorizable

    # --- LLM pass for remaining consumers ---
    if llm_candidates:
        semaphore = asyncio.Semaphore(_MAX_CONCURRENT_LLM_CALLS)
        outcomes = await asyncio.gather(
            *[
                _process_one(consumer, persona_lookup, personas, openai_client, semaphore)
                for consumer in llm_candidates
            ]
        )
        for outcome in outcomes:
            status = outcome["status"]
            if status == "processed":
                result.processed += 1
                if outcome.get("low_confidence"):
                    result.low_confidence += 1
            else:
                result.failed += 1
                result.errors.append(outcome["error"])

    # --- single commit ---
    try:
        db.add_all(consumers)
        db.commit()
    except Exception as exc:
        db.rollback()
        logger.error("Failed to commit persona assignments: %s", exc)
        raise

    return result
