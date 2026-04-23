"""Group approved ad variants by persona for Meta publish.

Data chain: AdVariant.consumer_id → Consumer.primary_persona_id → Persona.id.
Variants without a consumer or without a primary persona fall into an
"Uncategorized" bucket so nothing silently gets dropped on publish.

Targeting traits on the persona are deliberately empty for now — the Meta
publisher falls back to default demographics. TODO: populate real traits
(age_range, gender, interests) by aggregating Consumer.traits per persona,
or by adding a default_targeting JSON column to Persona.
"""

import json
import logging
from typing import Optional

from sqlalchemy.orm import Session

from models.ad_variant import AdVariant
from models.consumer import Consumer
from models.persona import Persona

logger = logging.getLogger(__name__)

UNCATEGORIZED_KEY = "__uncategorized__"
UNCATEGORIZED_NAME = "Uncategorized"


def _extract_script(meta_json: Optional[str]) -> str:
    if not meta_json:
        return ""
    try:
        parsed = json.loads(meta_json)
        if isinstance(parsed, dict):
            return parsed.get("script") or ""
    except (json.JSONDecodeError, ValueError):
        pass
    return ""


def group_approved_variants_by_persona(
    db: Session, campaign_id: int
) -> list[dict]:
    """Return persona groups of approved, completed, non-preview variants.

    Shape matches ``publish_campaign``'s ``persona_groups`` parameter:
        [
          {
            "persona_name": str,
            "persona_traits": dict,          # empty for now — see module docstring
            "variants": [
              {"id": int, "media_url": str, "script": str},
              ...
            ],
          },
          ...
        ]

    Returns an empty list if no approved variants exist.
    """
    rows = (
        db.query(AdVariant, Consumer, Persona)
        .outerjoin(Consumer, AdVariant.consumer_id == Consumer.id)
        .outerjoin(Persona, Consumer.primary_persona_id == Persona.id)
        .filter(
            AdVariant.campaign_id == campaign_id,
            AdVariant.status == "completed",
            AdVariant.is_approved.is_(True),
            AdVariant.is_preview.is_(False),
            AdVariant.media_url.isnot(None),
        )
        .all()
    )

    # Keep insertion order so tests and logs are deterministic.
    groups: dict[str, dict] = {}

    for variant, _consumer, persona in rows:
        key = persona.id if persona else UNCATEGORIZED_KEY
        name = persona.name if persona else UNCATEGORIZED_NAME

        if key not in groups:
            groups[key] = {
                "persona_name": name,
                "persona_traits": {},  # see TODO in module docstring
                "variants": [],
            }

        groups[key]["variants"].append(
            {
                "id": variant.id,
                "media_url": variant.media_url,
                "script": _extract_script(variant.meta),
            }
        )

    result = [g for g in groups.values() if g["variants"]]
    logger.info(
        "Grouped %d approved variants into %d persona groups for campaign %d",
        sum(len(g["variants"]) for g in result),
        len(result),
        campaign_id,
    )
    return result
