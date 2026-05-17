from __future__ import annotations

import json
import logging
import os

from dotenv import load_dotenv

from utils.responses_api_text import extract_responses_api_text
from utils.video_timing import (
    AUDIO_END_GUARD,
    AUDIO_START_GUARD,
    VEO_DURATION_SECONDS,
    allowed_video_seconds,
    dialogue_end_seconds,
    script_output_format_block,
    script_requirement_beat_ranges,
)
from services.consumer_traits_description import consumer_profile_text_for_script
from schemas.generation_preferences import GenerationPreferences
from openai import AsyncOpenAI
from xai_sdk import Client
from xai_sdk.chat import system, user, image

load_dotenv()

logger = logging.getLogger(__name__)

_SCRIPT_API_RESPONSE_LOG_MAX_LEN = 12_000


def _script_api_response_for_log(response: object) -> str:
    """Serialize a Script API response for error logs (truncated, no secrets scrubbing)."""
    try:
        if hasattr(response, "model_dump"):
            payload = response.model_dump(mode="json", exclude_none=True)
            text = json.dumps(payload, default=str)
        elif hasattr(response, "model_dump_json"):
            text = response.model_dump_json(exclude_none=True)
        else:
            text = json.dumps({"repr": repr(response)}, default=str)
    except Exception as exc:
        text = json.dumps(
            {"serialize_error": str(exc), "repr": repr(response)},
            default=str,
        )
    if len(text) > _SCRIPT_API_RESPONSE_LOG_MAX_LEN:
        return text[:_SCRIPT_API_RESPONSE_LOG_MAX_LEN] + "…[truncated]"
    return text


def _format_generation_preferences_block(prefs: GenerationPreferences | None) -> str:
    """Deterministic constraints from the user's Ad Studio preference panel (approved snapshot)."""
    if prefs is None:
        return ""
    data = prefs.model_dump(exclude_none=True)
    if not data:
        return ""
    labels = {
        "tone": "Tone",
        "cta_style": "CTA style",
        "language": "Spoken / narrative language",
        "budget_tier": "Budget tier (production scope signal)",
        "platforms": "Target platforms / placements",
        "personalization_range": "Personalization depth",
        "variants_per_group": "Variants per group (batch planning — preview count may differ)",
        "ad_formats": "Requested ad formats",
        "color_mode": "Color palette mode",
        "custom_color": "Custom accent / palette hex",
    }
    lines: list[str] = []
    for key, label in labels.items():
        if key not in data:
            continue
        val = data[key]
        if isinstance(val, list):
            val_str = ", ".join(str(x) for x in val)
        else:
            val_str = str(val)
        if val_str.strip():
            lines.append(f"- {label}: {val_str}")
    if not lines:
        return ""
    return (
        "User-approved generation preferences (hard constraints — honor these for tone, delivery, "
        "and implied visual palette; they override conflicting cues elsewhere in the brief):\n"
        + "\n".join(lines)
        + "\n\n"
    )


def _format_campaign_context_block(
    campaign_name: str = "",
    campaign_goal: str = "",
    campaign_target_audience: str = "",
    campaign_product_context: str = "",
) -> str:
    """Non-empty campaign DB fields as a structured block for the model."""
    parts: list[str] = []
    if (campaign_name or "").strip():
        parts.append(f"- Campaign name: {(campaign_name or '').strip()}")
    if (campaign_goal or "").strip():
        parts.append(f"- Campaign goal: {(campaign_goal or '').strip()}")
    if (campaign_target_audience or "").strip():
        parts.append(f"- Target audience (campaign): {(campaign_target_audience or '').strip()}")
    if (campaign_product_context or "").strip():
        parts.append(f"- Product in campaign context: {(campaign_product_context or '').strip()}")
    if not parts:
        return ""
    return (
        "Campaign context (strategic constraints for this spot; never read this list aloud or as on-screen copy):\n"
        + "\n".join(parts)
        + "\n\n"
    )


def _build_script_prompt(
    product_name: str,
    product_description: str,
    consumer_profile_text: str,
    campaign_brief: str = "",
    *,
    campaign_name: str = "",
    campaign_goal: str = "",
    campaign_target_audience: str = "",
    campaign_product_context: str = "",
    generation_preferences: GenerationPreferences | None = None,
    clip_seconds: int | None = None,
) -> str:
    """Build the ad script generation prompt with product and consumer context."""
    total = clip_seconds if clip_seconds is not None else allowed_video_seconds()
    t_end = dialogue_end_seconds(total)
    beat_ranges = script_requirement_beat_ranges(total)
    format_block = script_output_format_block(total)

    campaign_ctx = _format_campaign_context_block(
        campaign_name=campaign_name,
        campaign_goal=campaign_goal,
        campaign_target_audience=campaign_target_audience,
        campaign_product_context=campaign_product_context,
    )
    prefs_ctx = _format_generation_preferences_block(generation_preferences)
    return f"""You are a creative advertising director and consumer psychologist. Based on the product and audience profile below, create an entertaining short-form video concept that people would actually want to watch and share.
    Tailor the ad specifically for the following consumer based on their demographics, interests, personality, values and other characteristics: {consumer_profile_text}
    Don't explicitly mention the consumer profile in the script, but use it to tailor the ad to them.

    You will be provided with an image that includes a reference to the product, but the entire ad should be a creative ad video that gets created and scripted for. The first frame is going to be just the product, but you need to change away and then go into the rest of the video
  
    Product Name: {product_name}
    Product Description: {product_description or 'Not provided'}

    {campaign_ctx}{prefs_ctx}Creative direction (version brief — interpret freely; honor any campaign context above when present):
    Campaign Brief: {campaign_brief}

    Create a short video script designed to entertain first, not sell. Think about:
    1. What format would this audience actually engage with? (POV, reaction, "day in the life", comedic voiceover with quick cuts, storytime-to-camera, unexpected visual hook, duet/stitch energy without a literal second clip, etc.) — deliver "text-post" or trending-caption humor through dialogue, timing, and performance only; the video must not show readable words on screen (no on-screen captions, stickers, titles, or callouts).
    2. What emotional hook or relatable moment makes someone stop scrolling?
    3. How can you showcase the product naturally within a story, joke, or insight rather than selling it directly?
    4. What would make this person laugh, say "same", or immediately send it to a friend?

    Visual/audio constraints (hard rules): No readable text in-frame at any time (including logos-as-typography tricks). Voice, ambient sound, and music are fine; do not script or require open captions, subtitles, or any overlay viewers must read. If the platform would add captions later, that is out of scope — script for a clean image with spoken words only.

    {format_block}

    Requirements:
    1. {total} seconds exactly — output ONLY the Overview plus the four beats ({beat_ranges}) in that order; do not add extra beats, scenes, or alternate timelines.
    2. Fill every bullet field in every beat; use the reference image for accurate product color, shape, label, and packaging.
    3. Make it feel creator-made, not brand-made.
    4. No obvious call-to-action or sales language.
    5. Honor the audio-safe timeline: no spoken words in the first ~{AUDIO_START_GUARD}s or last ~{AUDIO_END_GUARD}s of the spot; last line fully finished before ~{t_end}s.

    Be bold with the creative direction. Surprise me with the format you choose in the Overview.
    All spoken lines must be complete (with a breath of space) before ~{t_end}s; only non-dialogue audio may continue to {total}s."""


def _moderation_revision_suffix(moderation_feedback: str, *, total_seconds: int) -> str:
    t_end = dialogue_end_seconds(total_seconds)
    return f"""

IMPORTANT — a previous draft failed content review. Write a complete replacement script that fixes ALL of the following while keeping the same {total_seconds}-second structured format (Overview plus Beats 1–4 with all fields), the same audio-safe margins (no speech first ~{AUDIO_START_GUARD}s or last ~{AUDIO_END_GUARD}s; dialogue ends before ~{t_end}s), and creative spirit:
{moderation_feedback}

Output only the new script; do not include meta-commentary about the review."""


def _veo_retime_suffix(source_script: str, *, from_seconds: int, to_seconds: int) -> str:
    return f"""

IMPORTANT — the finished video will be exactly {to_seconds} seconds (Google Veo with a product reference image).
Below is a {from_seconds}-second draft script. Rewrite it as a complete {to_seconds}-second ad script using the mandatory {to_seconds}s beat template in your instructions.
Preserve the same creative idea, product, and tone; compress dialogue and beats so all spoken lines fit the shorter timeline.
Do not copy old beat timestamps verbatim.

Draft script to adapt:
---
{source_script.strip()}
---

Output only the new {to_seconds}-second script."""


async def generate_ad_script(
    product_name: str,
    product_description: str,
    product_image_data_url: str,
    consumer_traits_string: str,
    campaign_brief: str = "",
    *,
    campaign_name: str = "",
    campaign_goal: str = "",
    campaign_target_audience: str = "",
    campaign_product_context: str = "",
    generation_preferences: GenerationPreferences | None = None,
    moderation_feedback: str = "",
    clip_seconds: int | None = None,
    prompt_suffix: str = "",
) -> str:
    api_key = os.getenv("SCRIPT_API_KEY", "").strip()
    model = os.getenv("SCRIPT_MODEL", "").strip()
    base_url = os.getenv("SCRIPT_BASE_URL", "").strip()
    script_client = AsyncOpenAI(api_key=api_key, base_url=base_url)

    total = clip_seconds if clip_seconds is not None else allowed_video_seconds()
    prompt = _build_script_prompt(
        product_name,
        product_description,
        consumer_traits_string,
        campaign_brief,
        campaign_name=campaign_name,
        campaign_goal=campaign_goal,
        campaign_target_audience=campaign_target_audience,
        campaign_product_context=campaign_product_context,
        generation_preferences=generation_preferences,
        clip_seconds=total,
    )
    if moderation_feedback:
        prompt += _moderation_revision_suffix(moderation_feedback, total_seconds=total)
    if prompt_suffix:
        prompt += prompt_suffix

    response = await script_client.responses.create(
        model=model,
        instructions="You are an expert advertising creative director specializing in short-form video ads.",
        input=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "input_text",
                        "text": prompt
                    },
                    {
                        "type": "input_image",
                        "image_url": product_image_data_url,
                        "detail": "high"
                    }
                ]
            }
        ],
        max_output_tokens=2000
    )

    script = extract_responses_api_text(response)
    if not script:
        raw_response = _script_api_response_for_log(response)
        status = getattr(response, "status", None)
        logger.error(
            "Script API returned no extractable text (model=%s, status=%s). raw_response=%s",
            model,
            status,
            raw_response,
        )
        raise ValueError("Script API returned no extractable text")
    return script


async def retime_ad_script_for_veo(
    source_script: str,
    product_name: str,
    product_description: str,
    product_image_data_url: str,
    consumer_traits_string: str,
    campaign_brief: str = "",
    *,
    from_seconds: int | None = None,
    campaign_name: str = "",
    campaign_goal: str = "",
    campaign_target_audience: str = "",
    campaign_product_context: str = "",
    generation_preferences: GenerationPreferences | None = None,
) -> str:
    """Rewrite a longer draft into an 8s beat template for Veo (reference_images cap)."""
    original_seconds = from_seconds if from_seconds is not None else allowed_video_seconds()
    suffix = _veo_retime_suffix(
        source_script,
        from_seconds=original_seconds,
        to_seconds=VEO_DURATION_SECONDS,
    )
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
        clip_seconds=VEO_DURATION_SECONDS,
        prompt_suffix=suffix,
    )


def batch_generate_ad_scripts(
    product_name: str,
    product_description: str,
    consumers: list["Consumer"],
    product_image_data_url: str,
    campaign_brief: str,
    *,
    campaign_name: str = "",
    campaign_goal: str = "",
    campaign_target_audience: str = "",
    campaign_product_context: str = "",
    generation_preferences: GenerationPreferences | None = None,
):
    api_key = os.getenv("SCRIPT_API_KEY", "").strip()
    model = os.getenv("SCRIPT_MODEL", "").strip()
    base_url = os.getenv("SCRIPT_BASE_URL", "").strip()
    batch_script_client = Client(api_key=api_key)

    batch = batch_script_client.batch.create(batch_name="batch_generate_ad_scripts")
    
    batch_requests = []
    for consumer in consumers:
        chat = batch_script_client.chat.create(
            model=model,
            batch_request_id=consumer.id,
        )
        consumer_traits_string = consumer_profile_text_for_script(consumer)
        prompt = _build_script_prompt(
            product_name,
            product_description,
            consumer_traits_string,
            campaign_brief,
            campaign_name=campaign_name,
            campaign_goal=campaign_goal,
            campaign_target_audience=campaign_target_audience,
            campaign_product_context=campaign_product_context,
            generation_preferences=generation_preferences,
        )
        chat.append(system("You are an expert advertising creative director specializing in short-form video ads."))
        chat.append(user(prompt, image(image_url=product_image_data_url, detail="high")))

        batch_requests.append(chat)
    batch_script_client.batch.add(batch_id=batch.batch_id, batch_requests=batch_requests)
    return batch.batch_id