"""Email verification sender using Resend."""

import logging
import os
import httpx

logger = logging.getLogger(__name__)


def send_verification_email(to_email: str, verification_code: str) -> None:
    api_key = os.getenv("RESEND_API_KEY")
    from_email = os.getenv("RESEND_FROM_EMAIL")

    if not api_key or not from_email:
        logger.error(
            "Resend config missing (has_api_key=%s, has_from_email=%s).",
            bool(api_key),
            bool(from_email),
        )
        raise RuntimeError("RESEND_API_KEY and RESEND_FROM_EMAIL must be configured.")

    payload = {
        "from": from_email,
        "to": [to_email],
        "subject": "Verify your Adgentic account",
        "html": (
            "<p>Welcome to Adgentic AI.</p>"
            "<p>Please enter this one-time verification code to activate your account.</p>"
            f"<p><strong>{verification_code}</strong></p>"
            "<p>This code expires in 15 minutes.</p>"
            "<p>If you did not create this account, you can ignore this email.</p>"
        ),
    }

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }

    try:
        response = httpx.post(
            "https://api.resend.com/emails",
            json=payload,
            headers=headers,
            timeout=10.0,
        )
        response.raise_for_status()
        logger.info("Verification email queued via Resend for %s.", to_email)
    except httpx.HTTPStatusError as exc:
        logger.error(
            "Resend rejected verification email for %s: status=%s body=%s",
            to_email,
            exc.response.status_code,
            exc.response.text,
        )
        raise
    except Exception:
        logger.exception("Unexpected Resend failure while sending to %s.", to_email)
        raise


def send_password_reset_email(to_email: str, reset_code: str) -> None:
    api_key = os.getenv("RESEND_API_KEY")
    from_email = os.getenv("RESEND_FROM_EMAIL")
    if not api_key or not from_email:
        logger.error(
            "Resend config missing (has_api_key=%s, has_from_email=%s).",
            bool(api_key),
            bool(from_email),
        )
        raise RuntimeError("RESEND_API_KEY and RESEND_FROM_EMAIL must be configured.")

    payload = {
        "from": from_email,
        "to": [to_email],
        "subject": "Reset your Adgentic password",
        "html": (
            "<p>We received a password reset request for your Adgentic account.</p>"
            f"<p><strong>{reset_code}</strong></p>"
            "<p>This code expires in 15 minutes.</p>"
            "<p>If you did not request this, you can ignore this email.</p>"
        ),
    }
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }
    try:
        response = httpx.post(
            "https://api.resend.com/emails",
            json=payload,
            headers=headers,
            timeout=10.0,
        )
        response.raise_for_status()
        logger.info("Password reset email queued via Resend for %s.", to_email)
    except httpx.HTTPStatusError as exc:
        logger.error(
            "Resend rejected reset email for %s: status=%s body=%s",
            to_email,
            exc.response.status_code,
            exc.response.text,
        )
        raise
    except Exception:
        logger.exception("Unexpected Resend failure while sending reset to %s.", to_email)
        raise
