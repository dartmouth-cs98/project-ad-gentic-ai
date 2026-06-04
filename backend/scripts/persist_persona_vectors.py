"""
One-off migration script: write GMM seed vectors into dbo.personas.

Reads the canonical seed matrix from seeds.py and stores each persona's
seed vector as a JSON array in the feature_vector column, keyed by name.

Pre-requisite — add the column to your DB before running:
    ALTER TABLE dbo.personas ADD feature_vector NVARCHAR(MAX) NULL;

Run from backend/ directory:
    python scripts/persist_persona_vectors.py

Safe to re-run: existing feature_vector values are overwritten with the
current seeds.py values (idempotent).
"""

import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text

from database import _get_session_factory
from services.gmm_persona_assignment.seeds import PERSONA_NAMES, get_seed_matrix


def main() -> None:
    seed_matrix = get_seed_matrix() # (NUM_PERSONAS, FEATURE_DIM)

    session_factory = _get_session_factory()
    db = session_factory()

    try:
        updated = 0
        missing = []

        for i, name in enumerate(PERSONA_NAMES):
            vector_json = json.dumps(seed_matrix[i].tolist())
            rows_affected = db.execute(
                text(
                    "UPDATE dbo.personas "
                    "SET feature_vector = :vec "
                    "WHERE name = :name"
                ),
                {"vec": vector_json, "name": name},
            ).rowcount

            if rows_affected == 0:
                missing.append(name)
            else:
                updated += 1
                print(f"  ✓ {name}")

        if missing:
            db.rollback()
            print(f"\nERROR: {len(missing)} persona(s) not found in DB:")
            for m in missing:
                print(f"  - {m}")
            print("\nRollback complete. Seed personas into dbo.personas first.")
            sys.exit(1)

        db.commit()
        print(f"\nDone. Updated {updated} persona(s).")

    except Exception as exc:
        db.rollback()
        print(f"\nERROR: {exc}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
