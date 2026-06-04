"""
GMM persona assignment - ML pipeline.

No DB access. Takes a raw feature matrix with NaNs, runs:
  IterativeImputer (MICE) -> StandardScaler -> apply_weights -> GaussianMixture

Public API:
  fit_and_predict(X) -> fit fresh, return (proba_matrix, FittedModel)
  predict(X, fitted) -> predict on new data with an already-fitted pipeline

Critical invariant: seeds must pass through the same fitted StandardScaler and apply_weights before being used as means_init, so they live in the same space as the training data.
"""

from __future__ import annotations

from dataclasses import dataclass

import numpy as np
from sklearn.experimental import enable_iterative_imputer  # noqa: F401 — side-effect import
from sklearn.impute import IterativeImputer
from sklearn.mixture import GaussianMixture
from sklearn.preprocessing import StandardScaler

from .seeds import NUM_PERSONAS, get_seed_matrix
from .vectorizer import FEATURE_DIM, apply_weights

# Minimum samples needed to fit a GMM with NUM_PERSONAS components.
# Below this, sklearn raises; caller should route to LLM fallback.
MIN_SAMPLES = NUM_PERSONAS


@dataclass
class FittedModel:
    """Fitted pipeline artifacts — imputer, scaler, and trained GMM."""
    imputer: IterativeImputer
    scaler: StandardScaler
    gmm: GaussianMixture


def fit_and_predict(X: np.ndarray) -> tuple[np.ndarray, FittedModel]:
    """Fit the full pipeline on X and return soft assignment probabilities.

    Fits from scratch on every call — no artifact persistence in v1.

    Args:
        X: (n_samples, FEATURE_DIM) float64. np.nan for missing values.
           Must have at least MIN_SAMPLES rows.

    Returns:
        proba: (n_samples, NUM_PERSONAS) float64. Rows sum to 1.0.
        fitted: Fitted pipeline for optional reuse via predict().

    Raises:
        ValueError: if X has wrong shape or too few rows.
    """
    if X.ndim != 2 or X.shape[1] != FEATURE_DIM:
        raise ValueError(f"X must have shape (n, {FEATURE_DIM}), got {X.shape}")
    if X.shape[0] < MIN_SAMPLES:
        raise ValueError(
            f"Need at least {MIN_SAMPLES} samples to fit GMM; got {X.shape[0]}. "
            "Route these consumers to LLM fallback instead."
        )

    imputer = IterativeImputer(random_state=42, max_iter=10)
    X_imp = imputer.fit_transform(X)

    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X_imp)
    X_weighted = apply_weights(X_scaled)

    # Seeds have no NaNs — skip imputer, but must go through the fitted scaler
    # so they live in the same space as X_weighted.
    seeds_weighted = apply_weights(scaler.transform(get_seed_matrix()))

    gmm = GaussianMixture(
        n_components=NUM_PERSONAS,
        covariance_type="diag",
        means_init=seeds_weighted,
        n_init=1, # warm start makes multiple inits redundant
        max_iter=100,
        random_state=42,
    )
    gmm.fit(X_weighted)

    fitted = FittedModel(imputer=imputer, scaler=scaler, gmm=gmm)
    return gmm.predict_proba(X_weighted), fitted


def predict(X: np.ndarray, fitted: FittedModel) -> np.ndarray:
    """Predict soft assignments on new data using an already-fitted pipeline.

    Args:
        X: (n_samples, FEATURE_DIM) float64. np.nan for missing values.
        fitted: FittedModel returned by fit_and_predict().

    Returns:
        proba: (n_samples, NUM_PERSONAS) float64. Rows sum to 1.0.
    """
    if X.ndim != 2 or X.shape[1] != FEATURE_DIM:
        raise ValueError(f"X must have shape (n, {FEATURE_DIM}), got {X.shape}")

    X_imp = fitted.imputer.transform(X)
    X_scaled = fitted.scaler.transform(X_imp)
    X_weighted = apply_weights(X_scaled)
    return fitted.gmm.predict_proba(X_weighted)
