"""Unit tests for gmm_persona_assignment/model.py.

Tests the ML pipeline contract: shape, probability validity, imputation,
and the warm-start invariant. No DB required.

Run from backend/ directory:
    python -m pytest tests/test_gmm_model.py -v
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import numpy as np
import pytest

from services.gmm_persona_assignment.model import (
    MIN_SAMPLES,
    FittedModel,
    fit_and_predict,
    predict,
)
from services.gmm_persona_assignment.seeds import NUM_PERSONAS, get_seed_matrix
from services.gmm_persona_assignment.vectorizer import FEATURE_DIM


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _synthetic_X(n: int, nan_fraction: float = 0.0, seed: int = 0) -> np.ndarray:
    """Generate a random (n, FEATURE_DIM) matrix with optional NaN injection."""
    rng = np.random.default_rng(seed)
    X = rng.uniform(0.0, 1.0, size=(n, FEATURE_DIM))
    if nan_fraction > 0.0:
        mask = rng.random(X.shape) < nan_fraction
        X[mask] = np.nan
    return X


# ---------------------------------------------------------------------------
# fit_and_predict: shape and probability contracts
# ---------------------------------------------------------------------------

def test_output_shape_is_n_by_num_personas():
    X = _synthetic_X(20)
    proba, fitted = fit_and_predict(X)
    assert proba.shape == (20, NUM_PERSONAS)
    assert isinstance(fitted, FittedModel)


def test_rows_sum_to_one():
    X = _synthetic_X(20)
    proba, _ = fit_and_predict(X)
    np.testing.assert_allclose(proba.sum(axis=1), np.ones(20), atol=1e-6)


def test_probabilities_are_non_negative():
    X = _synthetic_X(20)
    proba, _ = fit_and_predict(X)
    assert np.all(proba >= 0.0)


def test_probabilities_are_at_most_one():
    X = _synthetic_X(20)
    proba, _ = fit_and_predict(X)
    assert np.all(proba <= 1.0 + 1e-9)


# ---------------------------------------------------------------------------
# fit_and_predict: imputation with NaNs
# ---------------------------------------------------------------------------

def test_runs_with_40_percent_nan():
    X = _synthetic_X(30, nan_fraction=0.40)
    proba, _ = fit_and_predict(X)
    assert proba.shape == (30, NUM_PERSONAS)
    np.testing.assert_allclose(proba.sum(axis=1), np.ones(30), atol=1e-6)



def test_fully_present_and_nan_batches_give_same_shape():
    X_full = _synthetic_X(20)
    X_nan = _synthetic_X(20, nan_fraction=0.30)
    proba_full, _ = fit_and_predict(X_full)
    proba_nan, _ = fit_and_predict(X_nan)
    assert proba_full.shape == proba_nan.shape


# ---------------------------------------------------------------------------
# fit_and_predict: input validation
# ---------------------------------------------------------------------------

def test_wrong_feature_dim_raises():
    X = np.ones((10, FEATURE_DIM - 1))
    with pytest.raises(ValueError, match=str(FEATURE_DIM)):
        fit_and_predict(X)


def test_1d_input_raises():
    X = np.ones(FEATURE_DIM)
    with pytest.raises(ValueError):
        fit_and_predict(X)


def test_too_few_samples_raises():
    X = _synthetic_X(MIN_SAMPLES - 1)
    with pytest.raises(ValueError, match=str(MIN_SAMPLES)):
        fit_and_predict(X)


def test_exactly_min_samples_succeeds():
    X = _synthetic_X(MIN_SAMPLES)
    proba, _ = fit_and_predict(X)
    assert proba.shape == (MIN_SAMPLES, NUM_PERSONAS)


# ---------------------------------------------------------------------------
# predict: uses fitted pipeline on new data
# ---------------------------------------------------------------------------

def test_predict_output_shape():
    X_train = _synthetic_X(30)
    _, fitted = fit_and_predict(X_train)

    X_new = _synthetic_X(5, seed=99)
    proba = predict(X_new, fitted)
    assert proba.shape == (5, NUM_PERSONAS)


def test_predict_rows_sum_to_one():
    X_train = _synthetic_X(30)
    _, fitted = fit_and_predict(X_train)

    X_new = _synthetic_X(10, seed=7)
    proba = predict(X_new, fitted)
    np.testing.assert_allclose(proba.sum(axis=1), np.ones(10), atol=1e-6)


def test_predict_handles_nan_input():
    X_train = _synthetic_X(30)
    _, fitted = fit_and_predict(X_train)

    X_new = _synthetic_X(5, nan_fraction=0.50, seed=42)
    proba = predict(X_new, fitted)
    assert proba.shape == (5, NUM_PERSONAS)
    np.testing.assert_allclose(proba.sum(axis=1), np.ones(5), atol=1e-6)


def test_predict_wrong_shape_raises():
    X_train = _synthetic_X(30)
    _, fitted = fit_and_predict(X_train)

    X_bad = np.ones((5, FEATURE_DIM + 1))
    with pytest.raises(ValueError):
        predict(X_bad, fitted)


# ---------------------------------------------------------------------------
# Warm-start sanity: seeds can be recovered from their own cluster
# ---------------------------------------------------------------------------

def test_seed_matrix_shape():
    seeds = get_seed_matrix()
    assert seeds.shape == (NUM_PERSONAS, FEATURE_DIM)


def test_seeds_are_assigned_to_distinct_components():
    """When data is generated tightly around each seed, each seed
    should map to a distinct GMM component after fitting."""
    rng = np.random.default_rng(0)
    seeds = get_seed_matrix()

    # Generate n_per_cluster samples per persona, each a small perturbation of the seed
    n_per_cluster = 15
    rows = []
    labels = []
    for k, seed in enumerate(seeds):
        noise = rng.normal(0, 0.03, size=(n_per_cluster, FEATURE_DIM))
        cluster = np.clip(seed + noise, 0.0, 1.0)
        rows.append(cluster)
        labels.extend([k] * n_per_cluster)

    X = np.vstack(rows)
    proba, _ = fit_and_predict(X)
    assigned = np.argmax(proba, axis=1)

    # Each true-label group should predominantly map to a single component
    for k in range(NUM_PERSONAS):
        mask = np.array(labels) == k
        dominant_component = np.bincount(assigned[mask]).argmax()
        purity = np.mean(assigned[mask] == dominant_component)
        assert purity >= 0.6, (
            f"Persona {k}: GMM purity {purity:.2f} < 0.6. "
            "Warm-start may not be working correctly."
        )


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
