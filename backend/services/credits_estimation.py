"""Dry-run counts for preview/batch generation (same rules as ad_job_worker)."""

from __future__ import annotations

from sqlalchemy.orm import Session

from crud.ad_variant import get_ad_variant_by_campaign_consumer_version
from crud.campaign import get_campaign
from crud.consumer import get_all_consumers
from utils.campaign_version_brief import resolve_brief_and_preferences_for_version
from utils.plan_execution import (
    parse_plan_json_from_message,
    resolve_persona_ids_from_plan,
    resolve_preview_consumer_ids,
)


def estimate_preview_variant_count(
    db: Session, campaign_id: int, version_number: int
) -> int:
    return len(resolve_preview_consumer_ids(db, campaign_id, version_number))


def estimate_batch_variant_count(
    db: Session, campaign_id: int, version_number: int
) -> int:
    campaign = get_campaign(db, campaign_id)
    if campaign is None:
        return 0

    plan_message, _prefs, structured_brief = resolve_brief_and_preferences_for_version(
        campaign.brief, version_number
    )
    plan = parse_plan_json_from_message(plan_message or "") if plan_message else None
    if structured_brief and (plan_message or "").strip() and plan is None:
        return 0

    raw_groups = plan.get("persona_groups") if plan else None
    has_groups = isinstance(raw_groups, list) and len(raw_groups) > 0
    matched_persona_ids = resolve_persona_ids_from_plan(db, plan) if plan else set()
    if has_groups and not matched_persona_ids:
        return 0

    filter_by_persona = bool(has_groups and matched_persona_ids)
    consumers = get_all_consumers(db)
    need = 0
    for consumer in consumers:
        if filter_by_persona and consumer.primary_persona_id not in matched_persona_ids:
            continue
        existing = get_ad_variant_by_campaign_consumer_version(
            db,
            campaign_id=campaign_id,
            consumer_id=consumer.id,
            version_number=version_number,
        )
        if existing is None:
            need += 1
    return need
