import asyncio
import io
import os
import logging

from dotenv import load_dotenv
from openai import AsyncOpenAI

from utils.video_timing import allowed_video_seconds, video_prompt_audio_prefix

load_dotenv()

logger = logging.getLogger(__name__)

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
