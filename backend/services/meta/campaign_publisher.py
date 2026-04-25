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

import base64
import json
import logging
import tempfile
import time
from datetime import date
from io import BytesIO
from typing import BinaryIO, Optional
from urllib.parse import urlparse

import httpx
from PIL import Image

from services.meta.auth import decrypt_token
from services.storage.ad_video_media_url import (
    PUBLISH_SAS_EXPIRY_HOURS,
    VIDEO_CONTAINER_NAME,
    is_trusted_ad_video_backend_download_url,
    signed_ad_video_media_url,
)

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

# Pulling remote video into the ad library can take several minutes (transcode).
_ADVVIDEO_TIMEOUT_SECONDS = 600.0
# Download blob / CDN URL into a spool before multipart upload (Meta often cannot fetch Azure URLs).
_VIDEO_DOWNLOAD_TIMEOUT = httpx.Timeout(600.0, connect=60.0)
# Hold up to 512MB in RAM before spilling to disk while buffering the download.
_SPOOL_MAX_IN_MEMORY = 512 * 1024 * 1024
# Hard cap on server-side fallback download (per variant) to bound disk/IO under abuse or errors.
_MAX_FALLBACK_VIDEO_DOWNLOAD_BYTES = 500 * 1024 * 1024  # 500 MiB

# Meta often returns empty ``thumbnails`` until the Ad Video finishes processing.
_VIDEO_THUMB_POLL_ATTEMPTS = 15
_VIDEO_THUMB_POLL_INTERVAL_SEC = 2.0

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
    # Graph normally returns {"error": {...}}; proxies or edge cases may return a JSON array/string.
    if not isinstance(body, dict):
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


def _post(
    path: str,
    token: str,
    payload: dict,
    *,
    timeout: float = 30.0,
) -> dict:
    """POST JSON to Meta Graph with retry on transient errors."""
    last_exc: Optional[Exception] = None
    for attempt in range(_RETRY_ATTEMPTS):
        try:
            safe_body = {**payload, "access_token": "***REDACTED***"}
            logger.info(
                "Meta Graph POST /%s body=%s",
                path,
                json.dumps(safe_body, default=str),
            )
            resp = httpx.post(
                f"{META_GRAPH_BASE}/{path}",
                json={**payload, "access_token": token},
                timeout=timeout,
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


def _post_form(
    path: str,
    token: str,
    fields: dict,
    *,
    timeout: float = 30.0,
) -> dict:
    """POST ``application/x-www-form-urlencoded`` (Graph documents ``advideos`` this way)."""
    form = {k: v for k, v in fields.items() if v is not None}
    form["access_token"] = token
    last_exc: Optional[Exception] = None
    for attempt in range(_RETRY_ATTEMPTS):
        try:
            safe_log = {k: ("***REDACTED***" if k == "access_token" else v) for k, v in form.items()}
            logger.info(
                "Meta Graph POST (form) /%s fields=%s",
                path,
                json.dumps(safe_log, default=str),
            )
            resp = httpx.post(
                f"{META_GRAPH_BASE}/{path}",
                data=form,
                timeout=timeout,
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
    assert last_exc is not None
    raise last_exc


def _is_meta_file_url_fetch_failure(exc: httpx.HTTPStatusError) -> bool:
    """True when Meta could not pull ``file_url`` (e.g. Azure private / SAS / code 389)."""
    if exc.response.status_code != 400:
        return False
    try:
        body = exc.response.json()
        err = body.get("error")
        if not isinstance(err, dict):
            return False
        if err.get("error_subcode") == 1363057:
            return True
        if err.get("code") == 389:
            return True
        msg = (err.get("message") or "").lower()
        return "unable to fetch" in msg and "video" in msg
    except (ValueError, TypeError):
        return "unable to fetch" in (exc.response.text or "").lower()


def _video_filename_hint(file_url: str) -> str:
    leaf = urlparse(file_url).path.rstrip("/").rsplit("/", maxsplit=1)[-1] or "video.mp4"
    if not any(leaf.lower().endswith(ext) for ext in (".mp4", ".mov", ".webm", ".m4v")):
        return "video.mp4"
    return leaf


def _download_video_from_url(file_url: str) -> tuple[tempfile.SpooledTemporaryFile, int]:
    """Stream ``file_url`` into a spool; return (spool at position 0, byte size).

    Raises ``ValueError`` if the response is larger than
    ``_MAX_FALLBACK_VIDEO_DOWNLOAD_BYTES`` (checked via ``Content-Length`` when
    present and while streaming).
    """
    spool: tempfile.SpooledTemporaryFile = tempfile.SpooledTemporaryFile(
        max_size=_SPOOL_MAX_IN_MEMORY,
        mode="w+b",
    )
    total = 0
    try:
        with httpx.Client(timeout=_VIDEO_DOWNLOAD_TIMEOUT) as client:
            with client.stream("GET", file_url, follow_redirects=True) as resp:
                resp.raise_for_status()
                cl_header = resp.headers.get("content-length")
                if cl_header is not None:
                    try:
                        cl_val = int(cl_header.strip())
                    except ValueError:
                        cl_val = -1
                    if cl_val > _MAX_FALLBACK_VIDEO_DOWNLOAD_BYTES:
                        raise ValueError(
                            f"Video download refused: Content-Length {cl_val} exceeds "
                            f"maximum {_MAX_FALLBACK_VIDEO_DOWNLOAD_BYTES} bytes"
                        )
                for chunk in resp.iter_bytes(1024 * 1024):
                    if not chunk:
                        continue
                    if total + len(chunk) > _MAX_FALLBACK_VIDEO_DOWNLOAD_BYTES:
                        raise ValueError(
                            f"Video download exceeded maximum size "
                            f"({_MAX_FALLBACK_VIDEO_DOWNLOAD_BYTES} bytes) while streaming"
                        )
                    spool.write(chunk)
                    total += len(chunk)
        spool.seek(0)
        logger.info("Downloaded %d bytes from media URL for Meta advideos upload", total)
        return spool, total
    except Exception:
        spool.close()
        raise


def _post_multipart_advideos(
    ad_account_id: str,
    token: str,
    *,
    name: str,
    source: BinaryIO,
    filename: str,
    timeout: float,
) -> dict:
    """POST ``advideos`` with multipart ``source`` (video bytes)."""
    url = f"{META_GRAPH_BASE}/{ad_account_id}/advideos"
    last_exc: Optional[Exception] = None
    for attempt in range(_RETRY_ATTEMPTS):
        try:
            source.seek(0)
            logger.info(
                "Meta Graph POST (multipart) /%s/advideos name=%s filename=%s",
                ad_account_id,
                name,
                filename,
            )
            resp = httpx.post(
                url,
                data={"name": name, "access_token": token},
                files={"source": (filename, source, "video/mp4")},
                timeout=timeout,
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
                "Transient Meta error on advideos multipart (attempt %d/%d): %s — retrying in %ds",
                attempt + 1,
                _RETRY_ATTEMPTS,
                exc,
                delay,
            )
            time.sleep(delay)
    assert last_exc is not None
    raise last_exc


def _upload_video_to_ad_library(
    *,
    ad_account_id: str,
    token: str,
    file_url: str,
    name: str,
) -> str:
    """Register video in the ad account library; return Graph ``video_id``.

    Tries ``file_url`` first. If Meta cannot fetch the URL (common for Azure Blob),
    downloads the file on this server and uploads it as multipart ``source``.

    Unsigned Azure blob URLs (stored in DB) get a read SAS when
    ``AZURE_STORAGE_CONNECTION_STRING`` is set so Meta and this server can read the blob.
    """
    file_url = signed_ad_video_media_url(
        file_url.strip(),
        expiry_hours=PUBLISH_SAS_EXPIRY_HOURS,
    )
    title = (name or "Ad video")[:255]
    try:
        data = _post_form(
            f"{ad_account_id}/advideos",
            token,
            {"file_url": file_url, "name": title},
            timeout=_ADVVIDEO_TIMEOUT_SECONDS,
        )
        vid = data.get("video_id") or data.get("id")
        if not vid:
            raise RuntimeError(f"advideos response missing id/video_id: {data!r}")
        logger.info("Registered video in ad library via file_url id=%s", vid)
        return str(vid)
    except httpx.HTTPStatusError as exc:
        if not _is_meta_file_url_fetch_failure(exc):
            raise
        logger.warning(
            "Meta could not fetch file_url (code/subcode in response); "
            "uploading video bytes from this server instead.",
        )
        if not is_trusted_ad_video_backend_download_url(file_url):
            raise ValueError(
                "Server-side video download is not allowed for this media_url: "
                f"only https Azure Blob URLs in container "
                f"{VIDEO_CONTAINER_NAME!r} for the configured storage account "
                "(AZURE_STORAGE_CONNECTION_STRING) are permitted."
            ) from exc

    spool, _size = _download_video_from_url(file_url)
    try:
        fname = _video_filename_hint(file_url)
        data = _post_multipart_advideos(
            ad_account_id,
            token,
            name=title,
            source=spool,
            filename=fname,
            timeout=_ADVVIDEO_TIMEOUT_SECONDS,
        )
        vid = data.get("video_id") or data.get("id")
        if not vid:
            raise RuntimeError(f"advideos multipart response missing id/video_id: {data!r}")
        logger.info("Registered video in ad library via multipart source id=%s", vid)
        return str(vid)
    finally:
        spool.close()


def _fetch_ad_video_thumbnail_uri_once(token: str, video_id: str) -> Optional[str]:
    """Return a single thumbnail ``uri`` from Graph if available (may be empty while video processes)."""
    try:
        resp = httpx.get(
            f"{META_GRAPH_BASE}/{video_id}",
            params={"fields": "thumbnails", "access_token": token},
            timeout=30.0,
        )
        resp.raise_for_status()
        body = resp.json()
        thumbs = body.get("thumbnails")
        if not isinstance(thumbs, dict):
            return None
        rows = thumbs.get("data")
        if not isinstance(rows, list) or len(rows) == 0:
            return None
        for row in rows:
            if isinstance(row, dict) and row.get("is_preferred") and row.get("uri"):
                return str(row["uri"])
        for row in rows:
            if isinstance(row, dict) and row.get("uri"):
                return str(row["uri"])
    except Exception:
        logger.debug("Could not fetch thumbnails for video %s", video_id, exc_info=True)
    return None


def _poll_video_thumbnail_uri(token: str, video_id: str) -> Optional[str]:
    """Wait until Meta exposes at least one generated thumbnail URI."""
    for attempt in range(1, _VIDEO_THUMB_POLL_ATTEMPTS + 1):
        uri = _fetch_ad_video_thumbnail_uri_once(token, video_id)
        if uri:
            logger.info("Got Ad Video thumbnail URI after %d attempt(s)", attempt)
            return uri
        time.sleep(_VIDEO_THUMB_POLL_INTERVAL_SEC)
    logger.warning(
        "No thumbnail URI after %d polls for video %s",
        _VIDEO_THUMB_POLL_ATTEMPTS,
        video_id,
    )
    return None


def _download_url_bytes(url: str) -> bytes:
    r = httpx.get(url, follow_redirects=True, timeout=60.0)
    r.raise_for_status()
    return r.content


def _placeholder_thumbnail_png_bytes() -> bytes:
    """1200×628 PNG when Meta has no usable thumbnail (common feed / link aspect)."""
    buf = BytesIO()
    Image.new("RGB", (1200, 628), (45, 45, 48)).save(buf, format="PNG", compress_level=6)
    return buf.getvalue()


def _guess_thumbnail_filename(image_bytes: bytes) -> str:
    if len(image_bytes) >= 8 and image_bytes[:8] == b"\x89PNG\r\n\x1a\n":
        return "video_thumb.png"
    if len(image_bytes) >= 2 and image_bytes[:2] == b"\xff\xd8":
        return "video_thumb.jpg"
    return "video_thumb.jpg"


def _post_adimages(
    ad_account_id: str,
    token: str,
    *,
    image_bytes: bytes,
    filename: str,
    timeout: float = 120.0,
) -> dict:
    """POST ``/adimages`` using base64 ``bytes`` (Marketing API form style).

    Multipart raw file uploads often return *Invalid image format* (2446496); Meta documents
    ``bytes`` as a Base64 UTF-8 string for this edge.
    """
    url = f"{META_GRAPH_BASE}/{ad_account_id}/adimages"
    b64 = base64.b64encode(image_bytes).decode("ascii")
    logger.info(
        "Meta Graph POST /%s/adimages filename=%s raw_size=%d b64_len=%d",
        ad_account_id,
        filename,
        len(image_bytes),
        len(b64),
    )
    resp = httpx.post(
        url,
        data={
            "access_token": token,
            "filename": filename,
            "bytes": b64,
        },
        timeout=timeout,
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


def _adimages_response_hash(body: dict) -> str:
    imgs = body.get("images")
    if not isinstance(imgs, dict):
        raise RuntimeError(f"adimages response missing images: {body!r}")
    for v in imgs.values():
        if isinstance(v, dict) and v.get("hash"):
            return str(v["hash"])
    raise RuntimeError(f"adimages response missing hash: {body!r}")


def _resolve_video_thumbnail_image_hash(
    ad_account_id: str,
    token: str,
    video_id: str,
) -> str:
    """Upload a thumbnail to the ad image library and return ``image_hash`` for ``video_data``.

    Meta rejects many ``fbcdn`` URLs as ``image_url``; uploading bytes to ``adimages`` is reliable.
    """
    uri = _poll_video_thumbnail_uri(token, video_id)
    if uri:
        try:
            raw = _download_url_bytes(uri)
            if len(raw) < 100:
                raise ValueError("thumbnail download suspiciously small")
            body = _post_adimages(
                ad_account_id,
                token,
                image_bytes=raw,
                filename=_guess_thumbnail_filename(raw),
            )
            h = _adimages_response_hash(body)
            logger.info("Using Meta-generated video thumbnail as image_hash=%s", h)
            return h
        except Exception:
            logger.warning(
                "Could not use Meta thumbnail URI for adimages; using placeholder PNG",
                exc_info=True,
            )
    raw = _placeholder_thumbnail_png_bytes()
    body = _post_adimages(
        ad_account_id,
        token,
        image_bytes=raw,
        filename="placeholder_thumb.png",
    )
    h = _adimages_response_hash(body)
    logger.info("Using placeholder thumbnail image_hash=%s", h)
    return h


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
    attempted_variant_ads = 0
    succeeded_variant_ads = 0
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
            attempted_variant_ads += 1
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
                succeeded_variant_ads += 1
            except Exception:
                logger.exception(
                    "Failed to create ad for variant %s in persona '%s'",
                    variant.get("id"),
                    persona_name,
                )

    # If *every* ad creation failed, treat publish as failed so the UI can retry
    # and the campaign won't be marked active without any ads created.
    if attempted_variant_ads > 0 and succeeded_variant_ads == 0:
        raise MetaPublishError(
            "Meta publish failed: no ads were created for any variant (all attempts failed).",
            meta_campaign_id=meta_campaign_id,
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
    file_url = variant["media_url"]
    video_id = _upload_video_to_ad_library(
        ad_account_id=ad_account_id,
        token=token,
        file_url=file_url,
        name=f"{campaign_name} — variant {variant['id']}",
    )
    thumb_hash = _resolve_video_thumbnail_image_hash(ad_account_id, token, video_id)
    video_data: dict = {
        "video_id": video_id,
        "message": message,
        "image_hash": thumb_hash,
        "call_to_action": {"type": "LEARN_MORE"},
    }

    creative_resp = _post(
        f"{ad_account_id}/adcreatives",
        token,
        {
            "name": f"{persona_name} — Variant #{variant['id']}",
            "object_story_spec": {
                "page_id": facebook_page_id,
                # Marketing API: object_story_spec uses instagram_user_id (not instagram_actor_id).
                "instagram_user_id": instagram_account_id,
                "video_data": video_data,
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
