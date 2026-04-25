from __future__ import annotations

import os
import json

from dotenv import load_dotenv

from utils.video_timing import (
    AUDIO_END_GUARD,
    AUDIO_START_GUARD,
    allowed_video_seconds,
    dialogue_end_seconds,
    script_output_format_block,
    script_requirement_beat_ranges,
)
from services.consumer_traits_description import consumer_profile_text_for_script
from openai import AsyncOpenAI
from xai_sdk import Client
from xai_sdk.chat import system, user, image

load_dotenv()


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
) -> str:
    """Build the ad script generation prompt with product and consumer context."""
    total = allowed_video_seconds()
    t_end = dialogue_end_seconds(total)
    beat_ranges = script_requirement_beat_ranges(total)
    format_block = script_output_format_block(total)

    campaign_ctx = _format_campaign_context_block(
        campaign_name=campaign_name,
        campaign_goal=campaign_goal,
        campaign_target_audience=campaign_target_audience,
        campaign_product_context=campaign_product_context,
    )
    return f"""You are a creative advertising director and consumer psychologist. Based on the product and audience profile below, create an entertaining short-form video concept that people would actually want to watch and share.
    Tailor the ad specifically for the following consumer based on their demographics, interests, personality, values and other characteristics: {consumer_profile_text}
    Don't explicitly mention the consumer profile in the script, but use it to tailor the ad to them.

    You will be provided with an image that includes a reference to the product, but the entire ad should be a creative ad video that gets created and scripted for. The first frame is going to be just the product, but you need to change away and then go into the rest of the video
  
    Product Name: {product_name}
    Product Description: {product_description or 'Not provided'}

    {campaign_ctx}Creative direction (version brief — interpret freely; honor any campaign context above when present):
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
    moderation_feedback: str = "",
) -> str:
    api_key = os.getenv("SCRIPT_API_KEY", "").strip()
    model = os.getenv("SCRIPT_MODEL", "").strip()
    base_url = os.getenv("SCRIPT_BASE_URL", "").strip()
    script_client = AsyncOpenAI(api_key=api_key, base_url=base_url)

    total = allowed_video_seconds()
    prompt = _build_script_prompt(
        product_name,
        product_description,
        consumer_traits_string,
        campaign_brief,
        campaign_name=campaign_name,
        campaign_goal=campaign_goal,
        campaign_target_audience=campaign_target_audience,
        campaign_product_context=campaign_product_context,
    )
    if moderation_feedback:
        prompt += _moderation_revision_suffix(moderation_feedback, total_seconds=total)

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

    # Responses API: output is a list of items; each item has content (list) with text.
    if not response.output or len(response.output) == 0:
        raise ValueError("Script API returned no output")
    first_output = response.output[0]
    if not getattr(first_output, "content", None) or len(first_output.content) == 0:
        raise ValueError("Script API returned output with no content")
    script = first_output.content[0].text
    return script

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
        )
        chat.append(system("You are an expert advertising creative director specializing in short-form video ads."))
        chat.append(user(prompt, image(image_url=product_image_data_url, detail="high")))

        batch_requests.append(chat)
    batch_script_client.batch.add(batch_id=batch.batch_id, batch_requests=batch_requests)
    return batch.batch_id