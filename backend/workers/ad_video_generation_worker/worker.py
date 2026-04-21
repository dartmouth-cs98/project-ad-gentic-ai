import asyncio
import io
import os
import logging

from dotenv import load_dotenv
from openai import AsyncOpenAI

load_dotenv()

logger = logging.getLogger(__name__)

# Prepended to every script for the video model so speech is not flush with 0s / hard end (reduces clipped audio).
VIDEO_PROMPT_AUDIO_PREFIX = """Mastering / timeline (mandatory — follow exactly):
- First ~0.5s: no spoken words — only ambient sound, subtle music bed, room tone, or silence while visuals hook.
- Last ~0.65s: no spoken words — only ambience, music tail, light foley, or silence after the final line has fully ended.
- All dialogue must live between ~0.5s and ~11.35s of this clip; finish complete phrases with a short breath of silence before ~11.35s, then hold visuals + non-dialogue audio through the end.
- Avoid hard cuts that start mid-consonant at t≈0 or truncate the final word at the end of the file.

---

"""

POLL_INTERVAL_SECONDS = 5
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
    
    creation_response = await video_client.videos.create(
        prompt=VIDEO_PROMPT_AUDIO_PREFIX + script,
        size="720x1280",
        seconds=12,
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
