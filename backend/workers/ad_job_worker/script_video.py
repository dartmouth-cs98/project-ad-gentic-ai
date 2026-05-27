"""Script + provider alignment before ad video generation (Veo 8s retime)."""

from __future__ import annotations

import asyncio
import logging
from typing import TYPE_CHECKING

from utils.video_provider_config import veo_configured
from utils.video_timing import VEO_DURATION_SECONDS, allowed_video_seconds
from workers.ad_video_generation_worker.provider_selection import (
    ProviderDecision,
    choose_video_provider_with_reason,
)
from workers.ad_video_generation_worker.worker import VideoProvider, resolve_video_provider
from workers.script_creation_worker.worker import generate_ad_script, retime_ad_script_for_veo
from workers.script_moderation_worker.worker import evaluate_script

if TYPE_CHECKING:
    from schemas.generation_preferences import GenerationPreferences

logger = logging.getLogger(__name__)


async def _moderate_script_with_optional_revision(
    script: str,
    *,
    product_name: str,
    product_description: str,
    product_image_data_url: str,
    consumer_traits_string: str,
    campaign_brief: str,
    campaign_name: str,
    campaign_goal: str,
    campaign_target_audience: str,
    campaign_product_context: str,
    generation_preferences: GenerationPreferences | None,
    clip_seconds: int | None,
) -> str:
    verdict = await evaluate_script(script)
    if verdict.passed:
        return script
    return await generate_ad_script(
        product_name,
        product_description,
        product_image_data_url,
        consumer_traits_string,
        campaign_brief,
        campaign_name=campaign_name,
        campaign_goal=campaign_goal,
        campaign_target_audience=campaign_target_audience,
        campaign_product_context=campaign_product_context,
        generation_preferences=generation_preferences,
        moderation_feedback=verdict.feedback,
        clip_seconds=clip_seconds,
    )


async def resolve_video_provider_for_script(script: str) -> tuple[VideoProvider, ProviderDecision]:
    decision = await asyncio.to_thread(choose_video_provider_with_reason, script)
    if decision.fallback_used:
        provider = resolve_video_provider(script, preferred="sora")
    else:
        provider = resolve_video_provider(script, preferred=decision.provider)
    return provider, decision


async def align_script_with_video_provider(
    script: str,
    provider: VideoProvider,
    *,
    product_name: str,
    product_description: str,
    product_image_data_url: str,
    consumer_traits_string: str,
    campaign_brief: str,
    campaign_name: str,
    campaign_goal: str,
    campaign_target_audience: str,
    campaign_product_context: str,
    generation_preferences: GenerationPreferences | None,
) -> tuple[str, VideoProvider, int]:
    """Return script, resolved provider, and clip length in seconds for video generation."""
    if provider != "veo" or not veo_configured():
        return script, provider, allowed_video_seconds()

    if allowed_video_seconds() == VEO_DURATION_SECONDS:
        return script, provider, VEO_DURATION_SECONDS

    logger.info(
        "Retime ad script from %ss to %ss for Veo (VIDEO_SECONDS=%s)",
        allowed_video_seconds(),
        VEO_DURATION_SECONDS,
        allowed_video_seconds(),
    )
    retimed = await retime_ad_script_for_veo(
        script,
        product_name,
        product_description,
        product_image_data_url,
        consumer_traits_string,
        campaign_brief,
        from_seconds=allowed_video_seconds(),
        campaign_name=campaign_name,
        campaign_goal=campaign_goal,
        campaign_target_audience=campaign_target_audience,
        campaign_product_context=campaign_product_context,
        generation_preferences=generation_preferences,
    )
    retimed = await _moderate_script_with_optional_revision(
        retimed,
        product_name=product_name,
        product_description=product_description,
        product_image_data_url=product_image_data_url,
        consumer_traits_string=consumer_traits_string,
        campaign_brief=campaign_brief,
        campaign_name=campaign_name,
        campaign_goal=campaign_goal,
        campaign_target_audience=campaign_target_audience,
        campaign_product_context=campaign_product_context,
        generation_preferences=generation_preferences,
        clip_seconds=VEO_DURATION_SECONDS,
    )
    return retimed, "veo", VEO_DURATION_SECONDS
