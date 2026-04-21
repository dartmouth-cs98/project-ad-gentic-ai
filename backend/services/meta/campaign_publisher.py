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

import json
import logging
from datetime import date
from typing import Optional

import httpx

from services.meta.auth import decrypt_token

logger = logging.getLogger(__name__)

META_GRAPH_VERSION = "v21.0"
META_GRAPH_BASE = f"https://graph.facebook.com/{META_GRAPH_VERSION}"

GOAL_TO_OBJECTIVE = {
    "brand_awareness": "BRAND_AWARENESS",
    "reach": "REACH",
    "traffic": "LINK_CLICKS",
    "engagement": "POST_ENGAGEMENT",
    "leads": "LEAD_GENERATION",
    "sales": "OUTCOME_SALES",
    "conversions": "OUTCOME_SALES",
}
DEFAULT_OBJECTIVE = "OUTCOME_AWARENESS"

DEFAULT_CAMPAIGN_DAYS = 30
MIN_DAILY_BUDGET_CENTS = 100  # Meta minimum is $1/day per ad set


def _post(path: str, token: str, payload: dict) -> dict:
    resp = httpx.post(
        f"{META_GRAPH_BASE}/{path}",
        json={**payload, "access_token": token},
        timeout=30,
    )
    resp.raise_for_status()
    return resp.json()


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
) -> str:
    """Build the full Meta campaign hierarchy and return the Meta campaign ID."""
    token = decrypt_token(encrypted_token)
    objective = GOAL_TO_OBJECTIVE.get((goal or "").lower(), DEFAULT_OBJECTIVE)

    # ── 1. Campaign ───────────────────────────────────────────────────────
    campaign_resp = _post(
        f"{ad_account_id}/campaigns",
        token,
        {
            "name": campaign_name,
            "objective": objective,
            "status": "PAUSED",  # client activates in Meta Ads Manager after review
            "special_ad_categories": [],
        },
    )
    meta_campaign_id: str = campaign_resp["id"]
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

        adset_resp = _post(
            f"{ad_account_id}/adsets",
            token,
            {
                "name": f"{campaign_name} — {persona_name}",
                "campaign_id": meta_campaign_id,
                "daily_budget": daily_budget_cents,
                "billing_event": "IMPRESSIONS",
                "optimization_goal": "REACH",
                "targeting": targeting,
                "status": "PAUSED",
                **({"start_time": start_date.isoformat()} if start_date else {}),
                **({"end_time": end_date.isoformat()} if end_date else {}),
            },
        )
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
