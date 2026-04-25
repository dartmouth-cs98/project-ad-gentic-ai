"""Unit tests for gmm_persona_assignment/vectorizer.py.

No DB, no sklearn — pure input/output checks.

Run from backend/ directory:
    python -m pytest tests/test_gmm_vectorizer.py -v
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import numpy as np
import pytest

from services.gmm_persona_assignment.vectorizer import (
    FEATURE_DIM,
    FEATURE_WEIGHTS,
    F_AGE,
    F_AI_FAVORABILITY,
    F_AGREEABLENESS,
    F_CONSCIENTIOUSNESS,
    F_DECISION_MAKING,
    F_DEVICE_DESKTOP,
    F_DEVICE_MOBILE,
    F_DEVICE_TABLET,
    F_EDUCATION,
    F_GENDER_FEMALE,
    F_GENDER_MALE,
    F_GENDER_NONBINARY,
    F_HOMEOWNERSHIP,
    F_INCOME,
    F_NEUROTICISM,
    F_OPENNESS,
    F_SOCIABILITY,
    F_THOUGHT_PROCESS,
    apply_weights,
    encode_traits,
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _full_traits() -> dict:
    return {
        "age": 40,
        "income_range": "high",
        "education": "graduate",
        "homeownership": "owner",
        "sociability": 0.7,
        "decision_making": 0.3,
        "thought_process": 0.6,
        "openness": 0.8,
        "conscientiousness": 0.9,
        "agreeableness": 0.5,
        "neuroticism": 0.2,
        "ai_favorability": "positive",
        "gender": "female",
        "device": "mobile",
    }


# ---------------------------------------------------------------------------
# encode_traits: known inputs
# ---------------------------------------------------------------------------

def test_full_traits_encodes_correct_values():
    v = encode_traits(_full_traits())

    assert v.shape == (FEATURE_DIM,)
    assert v[F_AGE] == pytest.approx((40 - 18) / (80 - 18))
    assert v[F_INCOME] == pytest.approx(2 / 3)
    assert v[F_EDUCATION] == pytest.approx(1.0)
    assert v[F_HOMEOWNERSHIP] == pytest.approx(1.0)
    assert v[F_SOCIABILITY] == pytest.approx(0.7)
    assert v[F_DECISION_MAKING] == pytest.approx(0.3)
    assert v[F_THOUGHT_PROCESS] == pytest.approx(0.6)
    assert v[F_OPENNESS] == pytest.approx(0.8)
    assert v[F_CONSCIENTIOUSNESS] == pytest.approx(0.9)
    assert v[F_AGREEABLENESS] == pytest.approx(0.5)
    assert v[F_NEUROTICISM] == pytest.approx(0.2)
    assert v[F_AI_FAVORABILITY] == pytest.approx(2 / 3)


def test_gender_female_one_hot():
    v = encode_traits({"gender": "female"})
    assert v[F_GENDER_MALE] == pytest.approx(0.0)
    assert v[F_GENDER_FEMALE] == pytest.approx(1.0)
    assert v[F_GENDER_NONBINARY] == pytest.approx(0.0)


def test_gender_male_one_hot():
    v = encode_traits({"gender": "male"})
    assert v[F_GENDER_MALE] == pytest.approx(1.0)
    assert v[F_GENDER_FEMALE] == pytest.approx(0.0)
    assert v[F_GENDER_NONBINARY] == pytest.approx(0.0)


def test_gender_nonbinary_one_hot():
    v = encode_traits({"gender": "non-binary"})
    assert v[F_GENDER_MALE] == pytest.approx(0.0)
    assert v[F_GENDER_FEMALE] == pytest.approx(0.0)
    assert v[F_GENDER_NONBINARY] == pytest.approx(1.0)


def test_device_mobile_one_hot():
    v = encode_traits({"device": "mobile"})
    assert v[F_DEVICE_MOBILE] == pytest.approx(1.0)
    assert v[F_DEVICE_DESKTOP] == pytest.approx(0.0)
    assert v[F_DEVICE_TABLET] == pytest.approx(0.0)


def test_device_desktop_one_hot():
    v = encode_traits({"device": "desktop"})
    assert v[F_DEVICE_MOBILE] == pytest.approx(0.0)
    assert v[F_DEVICE_DESKTOP] == pytest.approx(1.0)
    assert v[F_DEVICE_TABLET] == pytest.approx(0.0)


def test_device_tablet_one_hot():
    v = encode_traits({"device": "tablet"})
    assert v[F_DEVICE_MOBILE] == pytest.approx(0.0)
    assert v[F_DEVICE_DESKTOP] == pytest.approx(0.0)
    assert v[F_DEVICE_TABLET] == pytest.approx(1.0)


def test_homeownership_renter():
    v = encode_traits({"homeownership": "renter"})
    assert v[F_HOMEOWNERSHIP] == pytest.approx(0.0)


def test_age_boundary_min():
    v = encode_traits({"age": 18})
    assert v[F_AGE] == pytest.approx(0.0)


def test_age_boundary_max():
    v = encode_traits({"age": 80})
    assert v[F_AGE] == pytest.approx(1.0)


def test_age_clipped_below_min():
    v = encode_traits({"age": 5})
    assert v[F_AGE] == pytest.approx(0.0)


def test_age_clipped_above_max():
    v = encode_traits({"age": 150})
    assert v[F_AGE] == pytest.approx(1.0)


def test_income_ordinal_values():
    assert encode_traits({"income_range": "low"})[F_INCOME] == pytest.approx(0.0)
    assert encode_traits({"income_range": "mid"})[F_INCOME] == pytest.approx(1 / 3)
    assert encode_traits({"income_range": "high"})[F_INCOME] == pytest.approx(2 / 3)
    assert encode_traits({"income_range": "very_high"})[F_INCOME] == pytest.approx(1.0)


def test_education_ordinal_values():
    assert encode_traits({"education": "high_school"})[F_EDUCATION] == pytest.approx(0.0)
    assert encode_traits({"education": "some_college"})[F_EDUCATION] == pytest.approx(1 / 3)
    assert encode_traits({"education": "bachelors"})[F_EDUCATION] == pytest.approx(2 / 3)
    assert encode_traits({"education": "graduate"})[F_EDUCATION] == pytest.approx(1.0)


def test_ai_favorability_ordinal_values():
    assert encode_traits({"ai_favorability": "negative"})[F_AI_FAVORABILITY] == pytest.approx(0.0)
    assert encode_traits({"ai_favorability": "neutral"})[F_AI_FAVORABILITY] == pytest.approx(1 / 3)
    assert encode_traits({"ai_favorability": "positive"})[F_AI_FAVORABILITY] == pytest.approx(2 / 3)
    assert encode_traits({"ai_favorability": "enthusiast"})[F_AI_FAVORABILITY] == pytest.approx(1.0)


# ---------------------------------------------------------------------------
# encode_traits: missing and invalid values → NaN
# ---------------------------------------------------------------------------

def test_empty_dict_is_all_nan():
    v = encode_traits({})
    assert v.shape == (FEATURE_DIM,)
    assert np.all(np.isnan(v))


def test_missing_age_is_nan():
    v = encode_traits({"income_range": "mid"})
    assert np.isnan(v[F_AGE])
    assert not np.isnan(v[F_INCOME])


def test_unknown_income_is_nan():
    v = encode_traits({"income_range": "wealthy"})
    assert np.isnan(v[F_INCOME])


def test_unknown_education_is_nan():
    v = encode_traits({"education": "phd"})
    assert np.isnan(v[F_EDUCATION])


def test_unknown_ai_favorability_is_nan():
    v = encode_traits({"ai_favorability": "meh"})
    assert np.isnan(v[F_AI_FAVORABILITY])


def test_unknown_gender_leaves_all_nan():
    v = encode_traits({"gender": "unknown"})
    assert np.isnan(v[F_GENDER_MALE])
    assert np.isnan(v[F_GENDER_FEMALE])
    assert np.isnan(v[F_GENDER_NONBINARY])


def test_unknown_device_leaves_all_nan():
    v = encode_traits({"device": "smartwatch"})
    assert np.isnan(v[F_DEVICE_MOBILE])
    assert np.isnan(v[F_DEVICE_DESKTOP])
    assert np.isnan(v[F_DEVICE_TABLET])


def test_non_numeric_age_is_nan():
    v = encode_traits({"age": "old"})
    assert np.isnan(v[F_AGE])


def test_none_age_is_nan():
    v = encode_traits({"age": None})
    assert np.isnan(v[F_AGE])


def test_psychographic_out_of_range_is_clipped():
    # Values outside [0, 1] should clamp, not produce NaN or error.
    v = encode_traits({"sociability": 1.5, "neuroticism": -0.3})
    assert v[F_SOCIABILITY] == pytest.approx(1.0)
    assert v[F_NEUROTICISM] == pytest.approx(0.0)


def test_unknown_fields_are_ignored():
    v = encode_traits({"zodiac": "scorpio", "favorite_color": "blue"})
    assert np.all(np.isnan(v))


# ---------------------------------------------------------------------------
# apply_weights
# ---------------------------------------------------------------------------

def test_apply_weights_shape_preserved():
    X = np.ones((5, FEATURE_DIM), dtype=np.float64)
    result = apply_weights(X)
    assert result.shape == (5, FEATURE_DIM)


def test_apply_weights_scales_correctly():
    X = np.ones((1, FEATURE_DIM), dtype=np.float64)
    result = apply_weights(X)
    np.testing.assert_allclose(result[0], FEATURE_WEIGHTS)


def test_apply_weights_zero_row_stays_zero():
    X = np.zeros((3, FEATURE_DIM), dtype=np.float64)
    result = apply_weights(X)
    assert np.all(result == 0.0)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
