"""Resolve chat plan JSON (persona groups, counts) for preview and batch ad generation."""

from __future__ import annotations

import json
import logging
import random
import re
from typing import Any, Optional

from sqlalchemy import select
from sqlalchemy.orm import Session

from models.persona import Persona
from schemas.generation_preferences import GenerationPreferences

logger = logging.getLogger(__name__)


def parse_plan_json_from_message(plan_message: str) -> Optional[dict[str, Any]]:
    """Extract the first ```json ... ``` object from the assistant plan message."""
    if not plan_message or not plan_message.strip():
        return None
    match = re.search(r"```json\s*(\{[\s\S]*?\})\s*```", plan_message)
    if not match:
        return None
    try:
        return json.loads(match.group(1))
    except json.JSONDecodeError:
        logger.warning("Plan message contained invalid JSON in fenced block")
        return None


def find_persona_for_plan_group_name(plan_name: str, personas: list[Persona]) -> Optional[Persona]:
    """Match plan persona_groups[].name to a global Persona row (case-insensitive, trimmed)."""
    if not plan_name or not str(plan_name).strip():
        return None
    needle = str(plan_name).strip().lower()
    for p in personas:
        if p.name.strip().lower() == needle:
            return p
    loose = [p for p in personas if needle in p.name.lower() or p.name.lower() in needle]
    if len(loose) == 1:
        return loose[0]
    return None


def load_all_personas(db: Session) -> list[Persona]:
    return list(db.scalars(select(Persona).order_by(Persona.name)).all())


def resolve_persona_ids_from_plan(db: Session, plan: dict[str, Any]) -> set[str]:
    """Map plan persona_groups to persona UUIDs that exist in the database."""
    groups = plan.get("persona_groups")
    if not isinstance(groups, list) or not groups:
        return set()
    personas = load_all_personas(db)
    out: set[str] = set()
    for g in groups:
        if not isinstance(g, dict):
            continue
        name = g.get("name")
        p = find_persona_for_plan_group_name(str(name or ""), personas)
        if p is not None:
            out.add(p.id)
        else:
            logger.warning("Plan persona group not matched to DB persona: %r", name)
    return out


def variants_per_group_target(group: dict[str, Any], prefs: Optional[GenerationPreferences]) -> int:
    """How many preview variants to aim for in this group (distinct consumers, capped later).

    Preference snapshot wins when set; else plan variant_count; else 4.
    Clamped to 1–10 to match the Ad Studio stepper.
    """
    if prefs is not None and prefs.variants_per_group is not None:
        n = int(prefs.variants_per_group)
    else:
        vc = group.get("variant_count")
        if vc is not None:
            try:
                n = int(vc)
            except (TypeError, ValueError):
                n = 4
        else:
            n = 4
    return max(1, min(10, n))


def pick_consumers_for_preview_group(
    consumers: list[Any],
    target_count: int,
) -> list[Any]:
    """Pick up to ``target_count`` distinct consumers (shuffle)."""
    if not consumers or target_count <= 0:
        return []
    pool = list(consumers)
    random.shuffle(pool)
    return pool[: min(target_count, len(pool))]
