"""Publishes an Ad-gentic campaign to Meta as a paid Instagram ad campaign.

Structure:
  1 Meta Campaign  (single objective, maps from campaign.goal)
  N Ad Sets        (one per persona — persona-specific targeting + budget split)
  M Ads per Set    (one per approved variant assigned to that persona)

Budget allocation:
  daily_per_adset = (budget_total / num_adsets / campaign_days) * 100  (cents)

TODO: Activate by completing the Meta OAuth flow in the Settings page after
      META_APP_ID, META_APP_SECRET, FERNET_SECRET_KEY env vars are set.
"""

import logging
import time
from datetime import date
from typing import Optional

import httpx

from services.meta.auth import decrypt_token

logger = logging.getLogger(__name__)

META_GRAPH_VERSION = "v21.0"
META_GRAPH_BASE = f"https://graph.facebook.com/{META_GRAPH_VERSION}"

# Use ODAX (Outcome-Driven) objectives — legacy values (e.g. LINK_CLICKS,
# POST_ENGAGEMENT) often return 400 on Marketing API v17+ / v21.
GOAL_TO_OBJECTIVE = {
    "brand_awareness": "OUTCOME_AWARENESS",
    "reach": "OUTCOME_AWARENESS",
    "traffic": "OUTCOME_TRAFFIC",
    "engagement": "OUTCOME_ENGAGEMENT",
    "leads": "OUTCOME_LEADS",
    "sales": "OUTCOME_SALES",
    "conversions": "OUTCOME_SALES",
}
DEFAULT_OBJECTIVE = "OUTCOME_AWARENESS"

# Ad set optimization must align with campaign objective (Meta validation).
_OBJECTIVE_TO_OPTIMIZATION_GOAL = {
    "OUTCOME_AWARENESS": "REACH",
    "OUTCOME_TRAFFIC": "LINK_CLICKS",
    "OUTCOME_ENGAGEMENT": "POST_ENGAGEMENT",
    "OUTCOME_LEADS": "LEAD_GENERATION",
    # Without a pixel, OFFSITE_CONVERSIONS would fail; LINK_CLICKS is a reasonable
    # traffic-style default until conversion tracking is wired.
    "OUTCOME_SALES": "LINK_CLICKS",
    "OUTCOME_APP_PROMOTION": "APP_INSTALLS",
}

DEFAULT_CAMPAIGN_DAYS = 30
MIN_DAILY_BUDGET_CENTS = 100  # Meta minimum is $1/day per ad set

# Retry tuning for transient Meta Graph failures (network / 5xx / 429).
# Auth and validation errors (4xx other than 429) fail fast.
_RETRY_ATTEMPTS = 3
_RETRY_BACKOFF_SECONDS = (1, 2, 4)
_TRANSIENT_STATUSES = {408, 429, 500, 502, 503, 504}


class MetaPublishError(Exception):
    """Raised when publishing to Meta fails.

    Carries the Meta campaign ID if it was created before the failure so the
    caller can persist it and resume on retry (skipping campaign creation).
    """

    def __init__(self, message: str, meta_campaign_id: Optional[str] = None):
        super().__init__(message)
        self.meta_campaign_id = meta_campaign_id


def _optimization_goal_for_objective(campaign_objective: str) -> str:
    return _OBJECTIVE_TO_OPTIMIZATION_GOAL.get(
        campaign_objective, _OBJECTIVE_TO_OPTIMIZATION_GOAL["OUTCOME_AWARENESS"]
    )


def _graph_error_message(resp: httpx.Response) -> str:
    """Best-effort parse of Graph API JSON error (400 responses are usually here)."""
    try:
        body = resp.json()
    except ValueError:
        return (resp.text or "")[:800]
    err = body.get("error")
    if not isinstance(err, dict):
        return (resp.text or "")[:800]
    parts: list[str] = []
    for key in ("message", "error_user_msg", "error_user_title"):
        val = err.get(key)
        if isinstance(val, str) and val.strip():
            parts.append(val.strip())
    if err.get("code") is not None:
        sub = err.get("error_subcode")
        code_part = f"code={err['code']}"
        if sub is not None:
            code_part += f", subcode={sub}"
        parts.append(code_part)
    return " — ".join(parts) if parts else (resp.text or "")[:800]


def _is_transient(exc: Exception) -> bool:
    if isinstance(exc, (httpx.TimeoutException, httpx.NetworkError, httpx.RemoteProtocolError)):
        return True
    if isinstance(exc, httpx.HTTPStatusError):
        return exc.response.status_code in _TRANSIENT_STATUSES
    return False


def _post(path: str, token: str, payload: dict) -> dict:
    """POST to Meta Graph with retry on transient errors."""
    last_exc: Optional[Exception] = None
    for attempt in range(_RETRY_ATTEMPTS):
        try:
            resp = httpx.post(
                f"{META_GRAPH_BASE}/{path}",
                json={**payload, "access_token": token},
                timeout=30,
            )
            try:
                resp.raise_for_status()
            except httpx.HTTPStatusError as exc:
                graph_msg = _graph_error_message(exc.response)
                if graph_msg:
                    raise httpx.HTTPStatusError(
                        f"{exc.response.status_code} {exc.response.reason_phrase} "
                        f"for {exc.request.url!s}: {graph_msg}",
                        request=exc.request,
                        response=exc.response,
                    ) from exc
                raise
            return resp.json()
        except Exception as exc:
            last_exc = exc
            if not _is_transient(exc) or attempt == _RETRY_ATTEMPTS - 1:
                raise
            delay = _RETRY_BACKOFF_SECONDS[attempt]
            logger.warning(
                "Transient Meta error on %s (attempt %d/%d): %s — retrying in %ds",
                path, attempt + 1, _RETRY_ATTEMPTS, exc, delay,
            )
            time.sleep(delay)
    # Unreachable — loop either returns or re-raises.
    assert last_exc is not None
    raise last_exc


def publish_campaign(
    *,
    campaign_name: str,
    goal: Optional[str],
    budget_total: Optional[float],
    start_date: Optional[date],
    end_date: Optional[date],
    # Variants grouped by persona:
    # [{"persona_name": str, "persona_traits": dict, "variants": [{"id", "media_url", "script"}]}]
    persona_groups: list[dict],
    encrypted_token: str,
    ad_account_id: str,       # format: act_XXXXXXXXX
    instagram_account_id: str,
    facebook_page_id: str,
    existing_meta_campaign_id: Optional[str] = None,
) -> str:
    """Build the full Meta campaign hierarchy and return the Meta campaign ID.

    If ``existing_meta_campaign_id`` is provided, campaign creation is skipped
    and ad sets/ads are attached to the existing campaign. This supports retry
    after a partial failure — callers should persist the returned campaign ID
    after the first successful step so retries can resume here.
    """
    token = decrypt_token(encrypted_token)
    objective = GOAL_TO_OBJECTIVE.get((goal or "").lower(), DEFAULT_OBJECTIVE)

    # ── 1. Campaign (skip if resuming) ───────────────────────────────────
    if existing_meta_campaign_id:
        meta_campaign_id = existing_meta_campaign_id
        logger.info("Resuming Meta publish with existing campaign %s", meta_campaign_id)
    else:
        try:
            campaign_resp = _post(
                f"{ad_account_id}/campaigns",
                token,
                {
                    "name": campaign_name,
                    "objective": objective,
                    "status": "PAUSED",  # client activates in Meta Ads Manager after review
                    "special_ad_categories": [],
                    # Required when budgets live on ad sets (not CBO). Matches Meta's
                    # POST /act_<id>/campaigns examples for v21+.
                    "is_adset_budget_sharing_enabled": False,
                },
            )
        except Exception as exc:
            raise MetaPublishError(f"Meta campaign creation failed: {exc}") from exc
        meta_campaign_id = campaign_resp["id"]
        logger.info("Created Meta campaign %s ('%s')", meta_campaign_id, campaign_name)

    # ── 2. Budget maths ───────────────────────────────────────────────────
    num_adsets = len(persona_groups)
    if num_adsets == 0:
        logger.warning("No persona groups with approved variants — skipping ad sets")
        return meta_campaign_id

    campaign_days = _campaign_days(start_date, end_date)
    total_budget = budget_total or 300.0  # default $300 if not set
    raw_daily_per_adset = (total_budget / num_adsets / campaign_days) * 100
    daily_budget_cents = max(int(raw_daily_per_adset), MIN_DAILY_BUDGET_CENTS)

    # ── 3. Ad Set + Ads per persona group ─────────────────────────────────
    for group in persona_groups:
        persona_name: str = group["persona_name"]
        persona_traits: dict = group.get("persona_traits") or {}
        variants: list[dict] = group.get("variants") or []

        if not variants:
            continue

        targeting = _build_targeting_for_persona(persona_traits)
        optimization_goal = _optimization_goal_for_objective(objective)

        try:
            adset_resp = _post(
                f"{ad_account_id}/adsets",
                token,
                {
                    "name": f"{campaign_name} — {persona_name}",
                    "campaign_id": meta_campaign_id,
                    "daily_budget": daily_budget_cents,
                    "billing_event": "IMPRESSIONS",
                    "bid_strategy": "LOWEST_COST_WITHOUT_CAP",
                    "optimization_goal": optimization_goal,
                    "targeting": targeting,
                    "status": "PAUSED",
                    **({"start_time": start_date.isoformat()} if start_date else {}),
                    **({"end_time": end_date.isoformat()} if end_date else {}),
                },
            )
        except Exception as exc:
            raise MetaPublishError(
                f"Ad set creation failed for persona '{persona_name}': {exc}",
                meta_campaign_id=meta_campaign_id,
            ) from exc
        adset_id: str = adset_resp["id"]
        logger.info(
            "Created ad set '%s' (budget: $%.2f/day)",
            persona_name,
            daily_budget_cents / 100,
        )

        for variant in variants:
            try:
                _create_ad_for_variant(
                    variant=variant,
                    token=token,
                    ad_account_id=ad_account_id,
                    adset_id=adset_id,
                    instagram_account_id=instagram_account_id,
                    facebook_page_id=facebook_page_id,
                    campaign_name=campaign_name,
                    persona_name=persona_name,
                )
            except Exception:
                logger.exception(
                    "Failed to create ad for variant %s in persona '%s'",
                    variant.get("id"),
                    persona_name,
                )

    return meta_campaign_id


def _create_ad_for_variant(
    *,
    variant: dict,
    token: str,
    ad_account_id: str,
    adset_id: str,
    instagram_account_id: str,
    facebook_page_id: str,
    campaign_name: str,
    persona_name: str,
) -> None:
    script = (variant.get("script") or "")[:2200]  # Meta copy limit
    message = script or campaign_name

    creative_resp = _post(
        f"{ad_account_id}/adcreatives",
        token,
        {
            "name": f"{persona_name} — Variant #{variant['id']}",
            "object_story_spec": {
                "page_id": facebook_page_id,
                "instagram_actor_id": instagram_account_id,
                "video_data": {
                    "video_url": variant["media_url"],
                    "message": message,
                    "call_to_action": {"type": "LEARN_MORE"},
                },
            },
        },
    )

    _post(
        f"{ad_account_id}/ads",
        token,
        {
            "name": f"{campaign_name} — {persona_name} — Variant #{variant['id']}",
            "adset_id": adset_id,
            "creative": {"creative_id": creative_resp["id"]},
            "status": "PAUSED",
        },
    )
    logger.info("Created Meta ad for variant %s (persona: %s)", variant["id"], persona_name)


def _build_targeting_for_persona(traits: dict) -> dict:
    """Convert persona trait dict to a Meta targeting spec.

    Trait keys (from our persona/consumer model):
      age_range: [min, max]
      gender: "male" | "female" | "all"
      interests: list[str]  (future: map to Meta interest IDs)
    """
    targeting: dict = {
        "geo_locations": {"countries": ["US"]},
        "publisher_platforms": ["instagram"],
        "instagram_positions": ["stream", "story", "reels"],
    }

    age_range = traits.get("age_range")
    if isinstance(age_range, list) and len(age_range) == 2:
        targeting["age_min"] = max(18, int(age_range[0]))
        targeting["age_max"] = min(65, int(age_range[1]))
    else:
        targeting["age_min"] = 18
        targeting["age_max"] = 65

    gender = traits.get("gender", "all")
    if gender == "male":
        targeting["genders"] = [1]
    elif gender == "female":
        targeting["genders"] = [2]
    # "all" → omit genders key (Meta default = all genders)

    return targeting


def _campaign_days(start_date: Optional[date], end_date: Optional[date]) -> int:
    if start_date and end_date and end_date > start_date:
        return (end_date - start_date).days
    return DEFAULT_CAMPAIGN_DAYS
