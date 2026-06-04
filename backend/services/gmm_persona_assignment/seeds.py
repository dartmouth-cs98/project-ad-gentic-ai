"""
Persona seed vectors for GMM warm-start initialisation.

Each seed is a point in the same feature space defined by vectorizer.py.
These act as the initial cluster centroids (means_init) for GaussianMixture,
guiding the EM algorithm toward interpretable, research-backed clusters
instead of random initialisation.

Seed values are chosen based on the defining traits of each persona type.
Values marked with # ? indicate genuine uncertainty — imputation will fill
these in during fitting, so leaving them at 0.5 (neutral) is correct.

Persona order is fixed and must match PERSONA_NAMES below.
The order also determines the component index used in model.py.
"""

from __future__ import annotations

import numpy as np

from .vectorizer import (
    FEATURE_DIM,
    F_AGE, F_INCOME, F_EDUCATION, F_HOMEOWNERSHIP,
    F_SOCIABILITY, F_DECISION_MAKING, F_THOUGHT_PROCESS,
    F_OPENNESS, F_CONSCIENTIOUSNESS, F_AGREEABLENESS, F_NEUROTICISM,
    F_AI_FAVORABILITY,
    F_GENDER_MALE, F_GENDER_FEMALE, F_GENDER_NONBINARY,
    F_DEVICE_MOBILE, F_DEVICE_DESKTOP, F_DEVICE_TABLET,
)

# Canonical persona names — must match exactly what is inserted into dbo.personas
PERSONA_NAMES = [
    "The Researcher",
    "The Impulse Buyer",
    "The Brand Loyalist",
    "The Value Seeker",
    "The Trend Follower",
    "The Practical Buyer",
]

NUM_PERSONAS = len(PERSONA_NAMES)


def _seed(overrides: dict[int, float]) -> np.ndarray:
    """Start from neutral (0.5) and apply defining trait values."""
    v = np.full(FEATURE_DIM, 0.5, dtype=np.float64)
    for idx, val in overrides.items():
        v[idx] = val
    return v


# ---------------------------------------------------------------------------
# Seed definitions
#
# Age encoded as normalised value over [18, 80]:
#   25 → 0.11   30 → 0.19   35 → 0.27   40 → 0.35
#   45 → 0.44   50 → 0.52   55 → 0.60
# ---------------------------------------------------------------------------

_SEEDS: list[np.ndarray] = [

    # 0 — The Researcher
    # Methodical, high education, high conscientiousness, low impulsivity.
    # Skews older (35-50), mid-to-high income, desktop user, AI-neutral.
    _seed({
        F_AGE:              0.35,   # ~40 yrs
        F_INCOME:           0.67,   # high
        F_EDUCATION:        1.0,    # graduate
        F_HOMEOWNERSHIP:    0.8,
        F_SOCIABILITY:      0.3,    # somewhat introverted
        F_DECISION_MAKING:  0.1,    # very thoughtful
        F_THOUGHT_PROCESS:  0.6,    # leans imaginative
        F_OPENNESS:         0.75,
        F_CONSCIENTIOUSNESS: 0.9,
        F_AGREEABLENESS:    0.6,
        F_NEUROTICISM:      0.3,    # stable
        F_AI_FAVORABILITY:  0.33,   # neutral
        F_GENDER_MALE:      0.5,
        F_GENDER_FEMALE:    0.5,
        F_GENDER_NONBINARY: 0.0,
        F_DEVICE_MOBILE:    0.2,
        F_DEVICE_DESKTOP:   0.7,
        F_DEVICE_TABLET:    0.1,
    }),

    # 1 — The Impulse Buyer
    # Spontaneous, emotional, low conscientiousness, high neuroticism.
    # Skews younger (20-30), mobile-first, high AI favorability.
    _seed({
        F_AGE:              0.14,   # ~27 yrs
        F_INCOME:           0.33,   # mid
        F_EDUCATION:        0.33,   # some college
        F_HOMEOWNERSHIP:    0.2,
        F_SOCIABILITY:      0.85,   # very extraverted
        F_DECISION_MAKING:  0.9,    # very impulsive
        F_THOUGHT_PROCESS:  0.7,
        F_OPENNESS:         0.7,
        F_CONSCIENTIOUSNESS: 0.2,
        F_AGREEABLENESS:    0.6,
        F_NEUROTICISM:      0.75,   # emotionally reactive
        F_AI_FAVORABILITY:  0.67,   # positive
        F_GENDER_MALE:      0.45,
        F_GENDER_FEMALE:    0.45,
        F_GENDER_NONBINARY: 0.1,
        F_DEVICE_MOBILE:    0.8,
        F_DEVICE_DESKTOP:   0.15,
        F_DEVICE_TABLET:    0.05,
    }),

    # 2 — The Brand Loyalist
    # Trust-driven, low openness, stable, community-oriented.
    # Skews mid-age (35-50), homeowner, mid income.
    _seed({
        F_AGE:              0.44,   # ~45 yrs
        F_INCOME:           0.33,   # mid
        F_EDUCATION:        0.67,   # bachelors
        F_HOMEOWNERSHIP:    0.9,
        F_SOCIABILITY:      0.55,
        F_DECISION_MAKING:  0.3,    # fairly thoughtful
        F_THOUGHT_PROCESS:  0.35,   # realistic
        F_OPENNESS:         0.2,    # low openness (key defining trait)
        F_CONSCIENTIOUSNESS: 0.7,
        F_AGREEABLENESS:    0.75,
        F_NEUROTICISM:      0.25,   # stable
        F_AI_FAVORABILITY:  0.33,   # neutral-to-negative
        F_GENDER_MALE:      0.45,
        F_GENDER_FEMALE:    0.5,
        F_GENDER_NONBINARY: 0.05,
        F_DEVICE_MOBILE:    0.5,
        F_DEVICE_DESKTOP:   0.4,
        F_DEVICE_TABLET:    0.1,
    }),

    # 3 — The Value Seeker
    # Price-conscious, practical, high conscientiousness, low income.
    # Wide age range, careful spender.
    _seed({
        F_AGE:              0.35,   # ~40 yrs
        F_INCOME:           0.0,    # low (defining trait)
        F_EDUCATION:        0.33,   # some college
        F_HOMEOWNERSHIP:    0.4,
        F_SOCIABILITY:      0.4,
        F_DECISION_MAKING:  0.25,   # thoughtful — deliberate about money
        F_THOUGHT_PROCESS:  0.3,    # realistic
        F_OPENNESS:         0.4,
        F_CONSCIENTIOUSNESS: 0.8,
        F_AGREEABLENESS:    0.55,
        F_NEUROTICISM:      0.5,
        F_AI_FAVORABILITY:  0.33,   # neutral
        F_GENDER_MALE:      0.5,
        F_GENDER_FEMALE:    0.45,
        F_GENDER_NONBINARY: 0.05,
        F_DEVICE_MOBILE:    0.55,
        F_DEVICE_DESKTOP:   0.35,
        F_DEVICE_TABLET:    0.1,
    }),

    # 4 — The Trend Follower
    # Novelty-seeking, socially aware, high openness, high AI favorability.
    # Skews young (18-28), mobile-first.
    _seed({
        F_AGE:              0.11,   # ~25 yrs
        F_INCOME:           0.33,   # mid
        F_EDUCATION:        0.33,   # some college
        F_HOMEOWNERSHIP:    0.1,
        F_SOCIABILITY:      0.9,    # very extraverted
        F_DECISION_MAKING:  0.7,    # fairly impulsive
        F_THOUGHT_PROCESS:  0.8,    # imaginative
        F_OPENNESS:         0.95,   # defining trait
        F_CONSCIENTIOUSNESS: 0.3,
        F_AGREEABLENESS:    0.65,
        F_NEUROTICISM:      0.55,
        F_AI_FAVORABILITY:  1.0,    # enthusiast (defining trait)
        F_GENDER_MALE:      0.35,
        F_GENDER_FEMALE:    0.55,
        F_GENDER_NONBINARY: 0.1,
        F_DEVICE_MOBILE:    0.85,
        F_DEVICE_DESKTOP:   0.1,
        F_DEVICE_TABLET:    0.05,
    }),

    # 5 — The Practical Buyer
    # Function-first, simple, durable, low neuroticism. No-frills.
    # Skews older (40-60), homeowner, desktop or mobile, mid income.
    _seed({
        F_AGE:              0.44,   # ~45 yrs
        F_INCOME:           0.33,   # mid
        F_EDUCATION:        0.67,   # bachelors
        F_HOMEOWNERSHIP:    0.85,
        F_SOCIABILITY:      0.35,
        F_DECISION_MAKING:  0.2,    # thoughtful
        F_THOUGHT_PROCESS:  0.15,   # very realistic (defining trait)
        F_OPENNESS:         0.3,
        F_CONSCIENTIOUSNESS: 0.85,  # high — deliberate, organised
        F_AGREEABLENESS:    0.6,
        F_NEUROTICISM:      0.15,   # very stable (defining trait)
        F_AI_FAVORABILITY:  0.33,   # neutral
        F_GENDER_MALE:      0.55,
        F_GENDER_FEMALE:    0.4,
        F_GENDER_NONBINARY: 0.05,
        F_DEVICE_MOBILE:    0.45,
        F_DEVICE_DESKTOP:   0.45,
        F_DEVICE_TABLET:    0.1,
    }),
]

# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def get_seed_matrix() -> np.ndarray:
    """
    Return the (NUM_PERSONAS, FEATURE_DIM) seed matrix for means_init.
    Weights are NOT applied here — apply_weights() is called separately
    after imputation so seeds stay in the same space as the data.
    """
    matrix = np.stack(_SEEDS, axis=0)
    assert matrix.shape == (NUM_PERSONAS, FEATURE_DIM)
    return matrix
