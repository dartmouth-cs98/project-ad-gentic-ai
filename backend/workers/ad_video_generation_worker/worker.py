import asyncio
import io
import logging
import os
from dotenv import load_dotenv
from google import genai
from google.genai import types as genai_types
from openai import AsyncOpenAI

from utils.video_timing import allowed_video_seconds, video_prompt_audio_prefix
from workers.ad_video_generation_worker.provider_selection import (
    VideoProvider,
    choose_video_provider_with_reason,
)

load_dotenv()

logger = logging.getLogger(__name__)

POLL_INTERVAL_SECONDS = 5

MAX_POLL_ATTEMPTS = 120  # 10 minutes at 5s interval
TERMINAL_FAILURE_STATUS = "failed"

_VEO_VERTEX_ENV_MARKERS = ("true", "1", "yes")

# Default matches Gemini API video docs (e.g. dialogue & reference-image examples).
DEFAULT_VEO_MODEL = "veo-3.1-generate-preview"

def _operation_generated_videos(operation: object) -> list | None:
    """Prefer ``operation.response`` (Gemini docs); fall back to ``operation.result`` (SDK)."""
    for candidate in (
        getattr(operation, "response", None),
        getattr(operation, "result", None),
    ):
        if candidate is None:
            continue
        vids = getattr(candidate, "generated_videos", None)
        if isinstance(vids, list) and len(vids) > 0:
            return vids
    return None


def _using_vertex_genai() -> bool:
    for env in ("GOOGLE_GENAI_USE_VERTEXAI", "GOOGLE_GENAI_USE_ENTERPRISE"):
        if os.getenv(env, "").strip().lower() in _VEO_VERTEX_ENV_MARKERS:
            return True
    return False


def _sora_configured() -> bool:
    api_key = os.getenv("VIDEO_API_KEY", "").strip()
    return bool(api_key) and api_key.upper() != "YOUR_API_KEY"


def _resolve_veo_api_key() -> str:
    """First non-empty Veo/Gemini API key (``GOOGLE_VEO_API_KEY`` > ``GOOGLE_API_KEY`` > ``GEMINI_API_KEY``)."""
    for env in ("GOOGLE_VEO_API_KEY", "GOOGLE_API_KEY", "GEMINI_API_KEY"):
        key = os.getenv(env, "").strip()
        if key and key.upper() != "YOUR_API_KEY":
            return key
    return ""


def _veo_configured() -> bool:
    return bool(_resolve_veo_api_key()) and not _using_vertex_genai()


def resolve_video_provider(
    script: str,
    *,
    preferred: VideoProvider | None = None,
) -> VideoProvider:
    """Pick a provider from script content, then fall back if that backend is not configured."""
    choice = preferred if preferred is not None else choose_video_provider_with_reason(script).provider
    if choice == "veo" and _veo_configured():
        return "veo"
    if choice == "sora" and _sora_configured():
        return "sora"
    if _veo_configured():
        logger.warning(
            "Preferred video provider %r unavailable; using Veo (GEMINI_API_KEY).",
            choice,
        )
        return "veo"
    if _sora_configured():
        logger.warning(
            "Preferred video provider %r unavailable; using Sora (VIDEO_API_KEY).",
            choice,
        )
        return "sora"
    return choice


async def generate_ad_video_for_script(
    script: str,
    product_image_bytes: bytes,
    product_image_type: str,
    product_image_filename: str,
) -> bytes:
    """Generate ad video using Sora or Veo based on script content and configured API keys."""
    decision = choose_video_provider_with_reason(script)
    preferred = decision.provider
    provider = resolve_video_provider(script, preferred=preferred)
    logger.info(
        "Ad video provider: %s (content pick=%s, confidence=%.2f, fallback=%s, reason=%s)",
        provider,
        preferred,
        decision.confidence,
        decision.fallback_used,
        decision.reason,
    )
    if provider == "veo":
        return await generate_ad_video_google_veo(
            script,
            product_image_bytes,
            product_image_type,
            product_image_filename,
        )
    return await generate_ad_video(
        script,
        product_image_bytes,
        product_image_type,
        product_image_filename,
    )


async def generate_ad_video(
    script: str,
    product_image_bytes: bytes,
    product_image_type: str,
    product_image_filename: str,
) -> bytes:
    api_key = os.getenv("VIDEO_API_KEY", "").strip()
    if not api_key or api_key.upper() == "YOUR_API_KEY":
        raise RuntimeError("Video generation env vars not configured.")

    video_client = AsyncOpenAI(api_key=api_key)
    seconds = allowed_video_seconds()
    prefix = video_prompt_audio_prefix(seconds)

    creation_response = await video_client.videos.create(
        prompt=prefix + script,
        size="720x1280",
        seconds=seconds,
        input_reference=(product_image_filename, io.BytesIO(product_image_bytes), product_image_type),
    )

    job_id = creation_response.id
    logger.info("Video generation job created: %s", job_id)
    job_status = creation_response
    attempt = 0

    while job_status.status != "completed":
        if job_status.status == TERMINAL_FAILURE_STATUS:
            raise RuntimeError(
                f"Video generation job {job_id} ended with status '{job_status.status}'."
            )
        attempt += 1
        if attempt >= MAX_POLL_ATTEMPTS:
            raise RuntimeError(
                f"Video generation job {job_id} did not complete within {MAX_POLL_ATTEMPTS * POLL_INTERVAL_SECONDS}s."
            )
        await asyncio.sleep(POLL_INTERVAL_SECONDS)
        # SDK expects positional job_id for retrieve and download_content
        job_status = await video_client.videos.retrieve(job_id)
    logger.info("Video generation job %s completed", job_id)
    download_response = await video_client.videos.download_content(job_id)
    ad_video_bytes = await download_response.aread()

    return ad_video_bytes


async def generate_ad_video_google_veo(
    script: str,
    product_image_bytes: bytes,
    product_image_type: str,
    product_image_filename: str,
) -> bytes:
    """Generate an ad video with Google Veo (Gemini Developer API + `google-genai`).

    Follows the patterns in the Gemini API video guide (dialogue-style prompts with
    native audio, plus Veo 3.1 ``reference_images`` for product assets):
    https://ai.google.dev/gemini-api/docs/video

    Uses ``GOOGLE_VEO_API_KEY`` if set, otherwise ``GOOGLE_API_KEY`` or
    ``GEMINI_API_KEY``. ``GOOGLE_VEO_MODEL`` overrides ``DEFAULT_VEO_MODEL``.

    ``product_image_filename`` is accepted for parity with :func:`generate_ad_video`
    but is not sent to the API (the product is passed as image bytes + MIME type).

    Vertex-only flows (GCS output / no file download API) are not supported here;
    keep ``GOOGLE_GENAI_USE_VERTEXAI`` unset when using this helper.
    """
    _ = product_image_filename
    if _using_vertex_genai():
        raise RuntimeError(
            "generate_ad_video_google_veo targets the Gemini Developer API. "
            "Unset GOOGLE_GENAI_USE_VERTEXAI / GOOGLE_GENAI_USE_ENTERPRISE or use a Google AI Studio API key."
        )

    api_key = _resolve_veo_api_key()
    if not api_key:
        raise RuntimeError(
            "Google Veo env vars not configured (set GOOGLE_VEO_API_KEY, GOOGLE_API_KEY, or GEMINI_API_KEY)."
        )

    model = os.getenv("GOOGLE_VEO_MODEL", "").strip() or DEFAULT_VEO_MODEL
    seconds = allowed_video_seconds()
    prefix = video_prompt_audio_prefix(seconds)
    # Veo 3.1: durationSeconds must be 8 when using reference_images (Gemini API table).
    if seconds != 8:
        logger.info(
            "Using reference_images with Veo 3.1 requires duration_seconds=8 per Gemini API; "
            "VIDEO_SECONDS=%s does not change the rendered length.",
            seconds,
        )
    duration_seconds = 8

    client = genai.Client(api_key=api_key)
    product_image = genai_types.Image(
        image_bytes=product_image_bytes,
        mime_type=product_image_type or "image/png",
    )
    reference_product_image = genai_types.VideoGenerationReferenceImage(
        image=product_image,
        reference_type="asset",
    )

    operation = await client.aio.models.generate_videos(
        model=model,
        prompt=prefix + script,
        config=genai_types.GenerateVideosConfig(
            number_of_videos=1,
            duration_seconds=duration_seconds,
            aspect_ratio="9:16",
            resolution="720p",
            reference_images=[reference_product_image],
            person_generation="allow_all",
        ),
    )

    attempt = 0
    while not operation.done:
        attempt += 1
        if attempt >= MAX_POLL_ATTEMPTS:
            raise RuntimeError(
                f"Veo video generation did not complete within {MAX_POLL_ATTEMPTS * POLL_INTERVAL_SECONDS}s."
            )
        await asyncio.sleep(POLL_INTERVAL_SECONDS)
        operation = await client.aio.operations.get(operation=operation)

    if operation.error:
        raise RuntimeError(f"Veo video generation failed: {operation.error}")

    generated = _operation_generated_videos(operation)
    if not generated:
        raise RuntimeError("Veo video generation completed but returned no videos.")

    video = generated[0].video
    if video.video_bytes:
        return bytes(video.video_bytes)

    data = await client.aio.files.download(file=video)
    if not isinstance(data, (bytes, bytearray)):
        raise RuntimeError("Unexpected payload from Gemini file download.")
    return bytes(data)
