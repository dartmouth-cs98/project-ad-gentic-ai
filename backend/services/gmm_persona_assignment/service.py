"""
GMM persona assignment — DB orchestration layer.

Fetches consumers from the DB, vectorizes their traits, runs the ML
pipeline, and writes primary/secondary persona assignments back.

Public API:
  run_gmm_assignment(db, ...)  — main entry point

Thresholds (tunable):
  SECONDARY_THRESHOLD -> minimum probability to write a secondary persona
  LOW_CONFIDENCE_MARK -> boundary reported in GMMAssignmentResult.low_confidence 
    (also the LLM fallback threshold used by the processor)
"""

from __future__ import annotations

import json
import logging
from dataclasses import dataclass, field
from datetime import datetime, timezone

import numpy as np
from sqlalchemy.orm import Session

from models.consumer import Consumer
from models.persona import Persona

from .model import MIN_SAMPLES, fit_and_predict
from .seeds import NUM_PERSONAS, PERSONA_NAMES
from .vectorizer import encode_traits

logger = logging.getLogger(__name__)

SECONDARY_THRESHOLD: float = 0.25
LOW_CONFIDENCE_MARK: float = 0.60


@dataclass
class GMMAssignmentResult:
    """Summary returned by run_gmm_assignment."""
    assigned: int = 0
    low_confidence: int = 0 # assigned but confidence < LOW_CONFIDENCE_MARK
    skipped: int = 0 # already had a persona; reassign_existing=False
    failed: int = 0 # missing traits or DB lookup error
    errors: list[str] = field(default_factory=list)
    persona_distribution: dict[str, int] = field(default_factory=dict)


def _load_persona_map(db: Session) -> dict[int, str]:
    """Map GMM component index (0-NUM_PERSONAS-1) -> persona UUID.

    Queries dbo.personas by name using PERSONA_NAMES order.
    Raises ValueError if any canonical persona is absent from the DB.
    """
    component_to_id: dict[int, str] = {}
    for i, name in enumerate(PERSONA_NAMES):
        persona = db.query(Persona).filter(Persona.name == name).first()
        if persona is None:
            raise ValueError(
                f"Persona '{name}' not found in DB. "
                "Seed personas before running GMM assignment."
            )
        component_to_id[i] = persona.id
    return component_to_id


def run_gmm_assignment(
    db: Session,
    business_client_id: int | None = None,
    reassign_existing: bool = False,
) -> GMMAssignmentResult:
    """Assign personas to consumers using the GMM pipeline.

    Args:
        db: -> Active SQLAlchemy session.
        business_client_id: -> Scope to one client, or None for all clients.
        reassign_existing: -> If False (default), consumers with a primary persona already set are skipped.

    Returns:
        GMMAssignmentResult with counts and per-persona distribution.

    Raises:
        ValueError: if canonical personas are missing from the DB.
        Exception: re-raises DB commit failures after rollback.
    """
    result = GMMAssignmentResult()

    component_to_id = _load_persona_map(db)
    component_to_name = {i: PERSONA_NAMES[i] for i in range(NUM_PERSONAS)}

    # --- fetch consumers ---
    query = db.query(Consumer)
    if business_client_id is not None:
        query = query.filter(Consumer.business_client_id == business_client_id)
    if not reassign_existing:
        query = query.filter(Consumer.primary_persona_id.is_(None))
    consumers = query.all()

    if not consumers:
        return result

    # --- pre-classify ---
    vectorizable: list[Consumer] = []
    for consumer in consumers:
        if not consumer.traits:
            result.failed += 1
            result.errors.append(f"Consumer {consumer.id}: no traits data")
        else:
            vectorizable.append(consumer)

    if len(vectorizable) < MIN_SAMPLES:
        # Too few samples for GMM — mark all as failed rather than crash.
        for consumer in vectorizable:
            result.failed += 1
            result.errors.append(
                f"Consumer {consumer.id}: batch too small for GMM "
                f"(need {MIN_SAMPLES}, got {len(vectorizable)})"
            )
        logger.warning(
            "Batch too small for GMM (%d < %d). No assignments made.",
            len(vectorizable),
            MIN_SAMPLES,
        )
        return result

    # --- vectorize -> fit -> assign ---
    X = np.stack([encode_traits(json.loads(c.traits)) for c in vectorizable])
    proba, _ = fit_and_predict(X)

    now = datetime.now(timezone.utc)

    for i, consumer in enumerate(vectorizable):
        row = proba[i]
        primary_idx = int(np.argmax(row))
        confidence = float(row[primary_idx])

        consumer.primary_persona_id = component_to_id[primary_idx]
        consumer.persona_confidence = confidence
        consumer.persona_assigned_at = now

        # Secondary: second-highest component, only if above threshold
        sorted_indices = np.argsort(row)[::-1]
        if len(sorted_indices) > 1 and row[sorted_indices[1]] >= SECONDARY_THRESHOLD:
            consumer.secondary_persona_id = component_to_id[sorted_indices[1]]
        else:
            consumer.secondary_persona_id = None

        result.assigned += 1
        if confidence < LOW_CONFIDENCE_MARK:
            result.low_confidence += 1

        name = component_to_name[primary_idx]
        result.persona_distribution[name] = result.persona_distribution.get(name, 0) + 1

        logger.info(
            "Consumer %d -> '%s' (confidence=%.2f)",
            consumer.id,
            name,
            confidence,
        )

    # --- single commit ---
    try:
        db.add_all(vectorizable)
        db.commit()
    except Exception as exc:
        db.rollback()
        logger.error("Failed to commit GMM assignments: %s", exc)
        raise

    return result
