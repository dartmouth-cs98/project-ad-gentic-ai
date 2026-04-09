"""
Trait vectorizer for GMM persona assignment.

Responsible for:
  - Defining the canonical feature list and encoding rules
  - Defining per-trait weights (applied after encoding, before GMM fitting)
  - Converting a raw consumer traits dict → fixed-length numpy vector

Missing values are encoded as np.nan and handled downstream by
sklearn's IterativeImputer (MICE) before the GMM sees the data.

Feature vector layout (in order):
  Index  Trait                   Type        Notes
  -----  -----                   ----        -----
  0      age                     continuous  normalised to [0,1] over [18,80]
  1      income_range            ordinal     low=0 mid=1 high=2 very_high=3  → /3
  2      education               ordinal     high_school=0 … graduate=3      → /3
  3      homeownership           binary      owner=1 renter=0
  4      sociability             continuous  0=introverted 1=extraverted
  5      decision_making         continuous  0=thoughtful  1=impulsive
  6      thought_process         continuous  0=realistic   1=imaginative
  7      openness                continuous  Big Five
  8      conscientiousness       continuous  Big Five
  9      agreeableness           continuous  Big Five
  10     neuroticism             continuous  Big Five
  11     ai_favorability         ordinal     negative=0 … enthusiast=3       → /3
  12     gender_male             one-hot
  13     gender_female           one-hot
  14     gender_nonbinary        one-hot
  15     device_mobile           one-hot
  16     device_desktop          one-hot
  17     device_tablet           one-hot

Total: 18 features

Traits intentionally excluded from v1:
  - relationship_status, religion, ethnicity, hometown  (too sparse / sensitive)
  - birthday, anniversary   (derived signals captured via age / homeownership)
  - recent_purchase         (free-text — needs embeddings, deferred to v2)
"""

from __future__ import annotations

import numpy as np

# ---------------------------------------------------------------------------
# Feature index constants — use these everywhere so index changes are safe
# ---------------------------------------------------------------------------

F_AGE              = 0
F_INCOME           = 1
F_EDUCATION        = 2
F_HOMEOWNERSHIP    = 3
F_SOCIABILITY      = 4
F_DECISION_MAKING  = 5
F_THOUGHT_PROCESS  = 6
F_OPENNESS         = 7
F_CONSCIENTIOUSNESS = 8
F_AGREEABLENESS    = 9
F_NEUROTICISM      = 10
F_AI_FAVORABILITY  = 11
F_GENDER_MALE      = 12
F_GENDER_FEMALE    = 13
F_GENDER_NONBINARY = 14
F_DEVICE_MOBILE    = 15
F_DEVICE_DESKTOP   = 16
F_DEVICE_TABLET    = 17

FEATURE_DIM = 18

FEATURE_NAMES = [
    "age", "income_range", "education", "homeownership",
    "sociability", "decision_making", "thought_process",
    "openness", "conscientiousness", "agreeableness", "neuroticism",
    "ai_favorability",
    "gender_male", "gender_female", "gender_nonbinary",
    "device_mobile", "device_desktop", "device_tablet",
]

# ---------------------------------------------------------------------------
# Trait weights
#
# Applied as a diagonal scaling matrix after encoding.  A weight of 2.0 means
# that trait has twice the influence on cluster distance as a weight of 1.0.
#
# Rationale:
#   - Psychographic traits (Big Five + decision style) are the strongest
#     predictors of ad response → highest weight (1.5–2.0)
#   - Demographics (age, income, education) are strong structural signals → 1.5
#   - Device / AI favorability signal channel preference → 1.2
#   - One-hot gender: lower weight to avoid over-splitting on gender alone → 0.8
# ---------------------------------------------------------------------------

FEATURE_WEIGHTS: np.ndarray = np.array([
    1.5,   # age
    1.5,   # income_range
    1.5,   # education
    1.0,   # homeownership
    2.0,   # sociability
    2.0,   # decision_making
    1.8,   # thought_process
    1.8,   # openness
    1.8,   # conscientiousness
    1.5,   # agreeableness
    1.8,   # neuroticism
    1.2,   # ai_favorability
    0.8,   # gender_male
    0.8,   # gender_female
    0.8,   # gender_nonbinary
    1.2,   # device_mobile
    1.2,   # device_desktop
    1.2,   # device_tablet
], dtype=np.float64)

assert len(FEATURE_WEIGHTS) == FEATURE_DIM, "FEATURE_WEIGHTS length must match FEATURE_DIM"

# ---------------------------------------------------------------------------
# Ordinal encoding maps
# ---------------------------------------------------------------------------

_INCOME_MAP = {"low": 0.0, "mid": 1 / 3, "high": 2 / 3, "very_high": 1.0}
_EDUCATION_MAP = {"high_school": 0.0, "some_college": 1 / 3, "bachelors": 2 / 3, "graduate": 1.0}
_AI_FAV_MAP = {"negative": 0.0, "neutral": 1 / 3, "positive": 2 / 3, "enthusiast": 1.0}

_AGE_MIN, _AGE_MAX = 18.0, 80.0


def _norm_age(age: float) -> float:
    return max(0.0, min(1.0, (age - _AGE_MIN) / (_AGE_MAX - _AGE_MIN)))


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def encode_traits(traits: dict) -> np.ndarray:
    """
    Convert a consumer traits dict to a fixed-length float64 vector.

    Missing or unrecognised values are encoded as np.nan.
    The returned vector has shape (FEATURE_DIM,).
    """
    v = np.full(FEATURE_DIM, np.nan, dtype=np.float64)

    # --- continuous / ordinal ---
    age = traits.get("age")
    if age is not None:
        try:
            v[F_AGE] = _norm_age(float(age))
        except (TypeError, ValueError):
            pass

    income = traits.get("income_range")
    if income in _INCOME_MAP:
        v[F_INCOME] = _INCOME_MAP[income]

    edu = traits.get("education")
    if edu in _EDUCATION_MAP:
        v[F_EDUCATION] = _EDUCATION_MAP[edu]

    home = traits.get("homeownership")
    if home == "owner":
        v[F_HOMEOWNERSHIP] = 1.0
    elif home == "renter":
        v[F_HOMEOWNERSHIP] = 0.0

    for idx, key in [
        (F_SOCIABILITY,       "sociability"),
        (F_DECISION_MAKING,   "decision_making"),
        (F_THOUGHT_PROCESS,   "thought_process"),
        (F_OPENNESS,          "openness"),
        (F_CONSCIENTIOUSNESS, "conscientiousness"),
        (F_AGREEABLENESS,     "agreeableness"),
        (F_NEUROTICISM,       "neuroticism"),
    ]:
        val = traits.get(key)
        if val is not None:
            try:
                v[idx] = max(0.0, min(1.0, float(val)))
            except (TypeError, ValueError):
                pass

    ai_fav = traits.get("ai_favorability")
    if ai_fav in _AI_FAV_MAP:
        v[F_AI_FAVORABILITY] = _AI_FAV_MAP[ai_fav]

    # --- one-hot: gender ---
    gender = traits.get("gender")
    if gender == "male":
        v[F_GENDER_MALE] = 1.0
        v[F_GENDER_FEMALE] = 0.0
        v[F_GENDER_NONBINARY] = 0.0
    elif gender == "female":
        v[F_GENDER_MALE] = 0.0
        v[F_GENDER_FEMALE] = 1.0
        v[F_GENDER_NONBINARY] = 0.0
    elif gender == "non-binary":
        v[F_GENDER_MALE] = 0.0
        v[F_GENDER_FEMALE] = 0.0
        v[F_GENDER_NONBINARY] = 1.0

    # --- one-hot: device ---
    device = traits.get("device")
    if device == "mobile":
        v[F_DEVICE_MOBILE] = 1.0
        v[F_DEVICE_DESKTOP] = 0.0
        v[F_DEVICE_TABLET] = 0.0
    elif device == "desktop":
        v[F_DEVICE_MOBILE] = 0.0
        v[F_DEVICE_DESKTOP] = 1.0
        v[F_DEVICE_TABLET] = 0.0
    elif device == "tablet":
        v[F_DEVICE_MOBILE] = 0.0
        v[F_DEVICE_DESKTOP] = 0.0
        v[F_DEVICE_TABLET] = 1.0

    return v


def apply_weights(X: np.ndarray) -> np.ndarray:
    """
    Scale feature matrix X (shape [n_samples, FEATURE_DIM]) by FEATURE_WEIGHTS.
    Call this after imputation and standard scaling.
    """
    return X * FEATURE_WEIGHTS
