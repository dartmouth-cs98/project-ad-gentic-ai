import asyncio
import io
import os
import logging

from dotenv import load_dotenv
from openai import AsyncOpenAI

load_dotenv()

logger = logging.getLogger(__name__)

POLL_INTERVAL_SECONDS = 5


def allowed_video_seconds() -> int:
    """Clip length for `videos.create` (API allows 4, 8, 12). Override with VIDEO_SECONDS."""
    raw = os.getenv("VIDEO_SECONDS", "12").strip()
    try:
        v = int(raw)
    except ValueError:
        return 12
    if v in (4, 8, 12):
        return v
    logger.warning("VIDEO_SECONDS=%r invalid; using 12 (allowed: 4, 8, 12)", raw)
    return 12


def video_prompt_audio_prefix(seconds: int) -> str:
    """Prepended to the script for the video model — speech guard bands scale with clip length."""
    if seconds == 12:
        t_end = 11.35
    elif seconds == 8:
        t_end = 7.35
    elif seconds == 4:
        t_end = 3.35
    else:
        t_end = round(max(0.5, seconds - 0.73), 2)
    return f"""Mastering / timeline (mandatory — follow exactly):
- First ~0.5s: no spoken words — only ambient sound, subtle music bed, room tone, or silence while visuals hook.
- Last ~0.65s: no spoken words — only ambience, music tail, light foley, or silence after the final line has fully ended.
- All dialogue must live between ~0.5s and ~{t_end}s of this clip; finish complete phrases with a short breath of silence before ~{t_end}s, then hold visuals + non-dialogue audio through the end.
- Avoid hard cuts that start mid-consonant at t≈0 or truncate the final word at the end of the file.

---

"""


MAX_POLL_ATTEMPTS = 120  # 10 minutes at 5s interval
TERMINAL_FAILURE_STATUS = "failed"


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
