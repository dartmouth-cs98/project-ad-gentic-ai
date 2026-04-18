"""
Seed script: updates existing consumer traits with new fields.
Preserves any existing trait data — only adds missing keys.
Regenerates ``consumer_traits_description`` from merged traits via the script LLM (``SCRIPT_*`` / Grok-compatible API).

Run from backend/ directory:
    python scripts/seed_consumer_traits.py
"""

import asyncio
import json
import random
import sys
import os
from datetime import datetime

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import _get_session_factory
from models.consumer import Consumer
from services.consumer_traits_description import generate_consumer_traits_description

# ---------------------------------------------------------------------------
# Trait value pools — keep realistic variety and intentional missing values
# ---------------------------------------------------------------------------

RELATIONSHIP_STATUSES = ["single", "married", "partnered", "divorced", "widowed", None]
RELIGIONS = ["Christian", "Muslim", "Jewish", "Hindu", "Buddhist", "Agnostic", "Atheist", None, None]  # None weighted higher = often missing
ETHNICITIES = ["White", "Black", "Hispanic", "Asian", "Mixed", "Other", None, None]
GENDERS = ["male", "female", "non-binary", None]
DEVICES = ["mobile", "desktop", "tablet"]
INCOME_RANGES = ["low", "mid", "high", "very_high"]
EDUCATIONS = ["high_school", "some_college", "bachelors", "graduate"]
AI_FAVORABILITIES = ["negative", "neutral", "positive", "enthusiast"]


def random_float(lo: float, hi: float, missing_prob: float = 0.15) -> float | None:
    """Return a float in [lo, hi] or None to simulate missing data."""
    if random.random() < missing_prob:
        return None
    return round(random.uniform(lo, hi), 2)


def random_choice(pool: list, missing_prob: float = 0.1):
    if random.random() < missing_prob:
        return None
    return random.choice([x for x in pool if x is not None])


def build_new_traits() -> dict:
    """
    Build a realistic, partially-complete set of new traits.
    Intentional gaps simulate real-world incomplete data.
    """
    current_year = datetime.now().year
    age = random.choice([None, None] + list(range(18, 75)))  # ~25% missing
    birthday = None
    if age:
        # Approximate — good enough for testing
        birth_year = current_year - age
        birthday = f"{birth_year}-{random.randint(1,12):02d}-{random.randint(1,28):02d}"

    has_anniversary = random.random() > 0.5
    anniversary = None
    if has_anniversary:
        years_ago = random.randint(1, 20)
        anniversary = f"{current_year - years_ago}-{random.randint(1,12):02d}-{random.randint(1,28):02d}"

    return {
        # Demographics
        "age":                 age,
        "gender":              random_choice(GENDERS, missing_prob=0.05),
        "ethnicity":           random_choice(ETHNICITIES, missing_prob=0.3),
        "religion":            random_choice(RELIGIONS, missing_prob=0.4),
        "relationship_status": random_choice(RELATIONSHIP_STATUSES, missing_prob=0.2),
        "hometown":            random_choice(["New York", "Los Angeles", "Chicago", "Houston", "Phoenix", "rural", None], missing_prob=0.35),
        "birthday":            birthday,
        "anniversary":         anniversary,

        # Socioeconomic
        "income_range":   random_choice(INCOME_RANGES, missing_prob=0.15),
        "education":      random_choice(EDUCATIONS, missing_prob=0.2),
        "homeownership":  random_choice(["owner", "renter", None], missing_prob=0.25),
        "device":         random_choice(DEVICES, missing_prob=0.05),

        # Psychographic (Big Five + extras) — continuous 0.0–1.0
        "sociability":        random_float(0.0, 1.0),           # 0=introverted, 1=extraverted
        "decision_making":    random_float(0.0, 1.0),           # 0=thoughtful, 1=impulsive
        "thought_process":    random_float(0.0, 1.0),           # 0=realistic, 1=imaginative
        "openness":           random_float(0.0, 1.0),
        "conscientiousness":  random_float(0.0, 1.0),
        "agreeableness":      random_float(0.0, 1.0),
        "neuroticism":        random_float(0.0, 1.0),

        # Tech / behavior
        "ai_favorability":  random_choice(AI_FAVORABILITIES, missing_prob=0.3),
        "recent_purchase":  random_choice(["electronics", "clothing", "food", "home goods", "fitness", "travel", None], missing_prob=0.4),
    }


async def _refresh_trait_descriptions(consumers: list) -> None:
    for consumer in consumers:
        try:
            traits_dict = json.loads(consumer.traits or "{}")
        except json.JSONDecodeError:
            traits_dict = {}
        try:
            consumer.consumer_traits_description = await generate_consumer_traits_description(
                traits_dict
            )
        except Exception as exc:
            print(f"  WARNING: consumer {consumer.id} traits_description LLM failed: {exc}")
            consumer.consumer_traits_description = ""


def main():
    session_factory = _get_session_factory()
    db = session_factory()

    try:
        consumers = db.query(Consumer).all()
        print(f"Found {len(consumers)} consumers to update.")

        for consumer in consumers:
            existing = {}
            if consumer.traits:
                try:
                    existing = json.loads(consumer.traits)
                except json.JSONDecodeError:
                    print(f"  WARNING: consumer {consumer.id} has malformed traits JSON — overwriting.")

            new_fields = build_new_traits()

            # Merge: existing values take priority, new fields fill the gaps
            merged = {**new_fields, **existing}
            consumer.traits = json.dumps(merged)

        asyncio.run(_refresh_trait_descriptions(consumers))
        db.commit()
        print(f"Done. Updated {len(consumers)} consumers.")

    except Exception as e:
        db.rollback()
        print(f"ERROR: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
