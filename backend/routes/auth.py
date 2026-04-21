"""Auth and onboarding routes — signup, signin, verification, and onboarding."""

import json
import logging
import os
import hashlib
import secrets
from datetime import datetime, timezone, timedelta

import httpx
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from email_validator import validate_email, EmailNotValidError

from database import get_db
from schemas.auth import (
    SignUpRequest,
    SignInRequest,
    GoogleAuthRequest,
    TokenResponse,
    SignUpResponse,
    ProfileResponse,
    OnboardingRequest,
    OnboardingResponse,
    VerifyEmailRequest,
    VerifyEmailResponse,
    ResendVerificationRequest,
    ResendVerificationResponse,
    RequestPasswordResetRequest,
    RequestPasswordResetResponse,
    ResetPasswordRequest,
    ResetPasswordResponse,
)
from crud.business_client import (
    get_by_email,
    get_by_id,
    create_business_client,
    update_onboarding,
    mark_email_verified,
    set_verification_token,
    is_verification_token_expired,
    set_password_reset_token,
    clear_password_reset_token,
    is_password_reset_token_expired,
)
from dependencies import get_current_client_id, create_access_token
from services.email_verification.service import send_verification_email, send_password_reset_email

router = APIRouter()
logger = logging.getLogger(__name__)

_pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

JWT_SECRET = os.getenv("JWT_SECRET")
if not JWT_SECRET:
    raise RuntimeError("JWT_SECRET environment variable must be set for JWT signing.")
EMAIL_VERIFICATION_TOKEN_TTL_MINUTES = int(os.getenv("EMAIL_VERIFICATION_TOKEN_TTL_MINUTES", "15"))

GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo"


# --- Helpers ---

def _hash_password(plain: str) -> str:
    return _pwd_context.hash(plain)


def _verify_password(plain: str, hashed: str) -> bool:
    return _pwd_context.verify(plain, hashed)


def _normalize_and_validate_email(raw_email: str, *, check_deliverability: bool = False) -> str:
    try:
        result = validate_email(raw_email, check_deliverability=check_deliverability)
        return result.normalized
    except EmailNotValidError as exc:
        raise HTTPException(status_code=400, detail=f"Invalid email address: {str(exc)}") from exc


def _generate_email_verification_code() -> str:
    return f"{secrets.randbelow(1000000):06d}"


def _hash_verification_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def _send_email_verification(client_email: str, code: str) -> None:
    logger.info("Attempting verification email send for %s.", client_email)
    send_verification_email(
        to_email=client_email,
        verification_code=code,
    )


def _send_password_reset_code(client_email: str, code: str) -> None:
    logger.info("Attempting password reset email send for %s.", client_email)
    send_password_reset_email(
        to_email=client_email,
        reset_code=code,
    )


# --- Endpoints ---

@router.post("/signup", response_model=SignUpResponse, status_code=202)
def signup(data: SignUpRequest, db: Session = Depends(get_db)):
    """Register a new business client and send a verification email."""
    normalized_email = _normalize_and_validate_email(data.email, check_deliverability=True)
    logger.info("Signup attempt for email=%s", normalized_email)
    if get_by_email(db, normalized_email):
        logger.info("Signup blocked: duplicate email=%s", normalized_email)
        raise HTTPException(
            status_code=409,
            detail="An account with this email already exists.",
        )

    verification_code = _generate_email_verification_code()
    token_hash = _hash_verification_token(verification_code)
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=EMAIL_VERIFICATION_TOKEN_TTL_MINUTES)

    hashed = _hash_password(data.password)
    client = create_business_client(
        db,
        normalized_email,
        hashed,
        data.plan,
        email_verification_token_hash=token_hash,
        email_verification_expires_at=expires_at,
    )
    try:
        _send_email_verification(client.email, verification_code)
    except Exception as exc:
        logger.exception("Signup email send failed for email=%s", client.email)
        raise HTTPException(
            status_code=500,
            detail="Unable to send verification email at this time.",
        ) from exc
    logger.info("Signup completed for email=%s; verification email dispatched.", client.email)

    return SignUpResponse(
        success=True,
        email=client.email,
        message="Account created. Please verify your email to continue.",
    )


@router.post("/signin", response_model=TokenResponse)
def signin(data: SignInRequest, db: Session = Depends(get_db)):
    """Authenticate a business client and return a JWT access token."""
    normalized_email = _normalize_and_validate_email(data.email)
    client = get_by_email(db, normalized_email)
    if (
        not client
        or not client.password_hash
        or not _verify_password(data.password, client.password_hash)
    ):
        raise HTTPException(status_code=401, detail="Invalid email or password.")
    if not client.email_verified:
        raise HTTPException(
            status_code=403,
            detail="Email not verified. Please verify your email before signing in.",
        )
    token = create_access_token(client.id, client.email)
    return TokenResponse(access_token=token, client_id=client.id, email=client.email)


@router.post("/verify-email", response_model=VerifyEmailResponse)
def verify_email(data: VerifyEmailRequest, db: Session = Depends(get_db)):
    """Mark a pending account as verified using a one-time code."""
    normalized_email = _normalize_and_validate_email(data.email)
    logger.info("Email verification attempt received for email=%s.", normalized_email)
    client = get_by_email(db, normalized_email)
    if not client:
        logger.warning("Email verification failed: account not found for %s", normalized_email)
        raise HTTPException(status_code=400, detail="Invalid or expired verification code.")

    token_hash = _hash_verification_token(data.code)
    if not client.email_verification_token_hash or client.email_verification_token_hash != token_hash:
        logger.warning("Email verification failed: code mismatch for email=%s", client.email)
        raise HTTPException(status_code=400, detail="Invalid or expired verification code.")

    if is_verification_token_expired(client):
        logger.warning("Email verification failed: token expired for email=%s", client.email)
        raise HTTPException(status_code=400, detail="Invalid or expired verification code.")

    mark_email_verified(db, client)
    token = create_access_token(client.id, client.email)
    logger.info("Email verification succeeded for email=%s", client.email)
    return VerifyEmailResponse(
        success=True,
        message="Email verified successfully. Continuing to onboarding.",
        access_token=token,
        client_id=client.id,
        email=client.email,
    )


@router.post("/resend-verification", response_model=ResendVerificationResponse)
def resend_verification(data: ResendVerificationRequest, db: Session = Depends(get_db)):
    """Resend verification email if account exists and is not already verified."""
    normalized_email = _normalize_and_validate_email(data.email)
    logger.info("Resend verification requested for email=%s", normalized_email)
    client = get_by_email(db, normalized_email)
    # Return a generic success response regardless of account existence.
    generic_response = ResendVerificationResponse(
        success=True,
        message="If an account exists, a verification email has been sent.",
    )
    if not client or client.email_verified:
        logger.info("Resend request short-circuited (missing user or already verified).")
        return generic_response

    verification_code = _generate_email_verification_code()
    token_hash = _hash_verification_token(verification_code)
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=EMAIL_VERIFICATION_TOKEN_TTL_MINUTES)
    set_verification_token(db, client, token_hash, expires_at)
    try:
        _send_email_verification(client.email, verification_code)
    except Exception as exc:
        logger.exception("Resend verification failed for email=%s", client.email)
        raise HTTPException(
            status_code=500,
            detail="Unable to send verification email at this time.",
        ) from exc
    logger.info("Resend verification succeeded for email=%s", client.email)
    return generic_response


@router.post("/request-password-reset", response_model=RequestPasswordResetResponse)
def request_password_reset(data: RequestPasswordResetRequest, db: Session = Depends(get_db)):
    """Request a one-time password reset code (generic success response)."""
    normalized_email = _normalize_and_validate_email(data.email)
    logger.info("Password reset requested for email=%s", normalized_email)
    client = get_by_email(db, normalized_email)
    generic_response = RequestPasswordResetResponse(
        success=True,
        message="If an account exists, a password reset code has been sent.",
    )
    if not client:
        return generic_response

    reset_code = _generate_email_verification_code()
    token_hash = _hash_verification_token(reset_code)
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=EMAIL_VERIFICATION_TOKEN_TTL_MINUTES)
    set_password_reset_token(db, client, token_hash, expires_at)
    try:
        _send_password_reset_code(client.email, reset_code)
    except Exception as exc:
        logger.exception("Password reset email send failed for email=%s", client.email)
        raise HTTPException(
            status_code=500,
            detail="Unable to send password reset code at this time.",
        ) from exc
    return generic_response


@router.post("/reset-password", response_model=ResetPasswordResponse)
def reset_password(data: ResetPasswordRequest, db: Session = Depends(get_db)):
    """Reset password using one-time code."""
    normalized_email = _normalize_and_validate_email(data.email)
    logger.info("Password reset confirmation attempt for email=%s", normalized_email)
    client = get_by_email(db, normalized_email)
    if not client:
        raise HTTPException(status_code=400, detail="Invalid or expired reset code.")

    token_hash = _hash_verification_token(data.code)
    if not client.password_reset_token_hash or client.password_reset_token_hash != token_hash:
        raise HTTPException(status_code=400, detail="Invalid or expired reset code.")
    if is_password_reset_token_expired(client):
        raise HTTPException(status_code=400, detail="Invalid or expired reset code.")
    if len(data.new_password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters long.")

    client.password_hash = _hash_password(data.new_password)
    db.commit()
    clear_password_reset_token(db, client)
    logger.info("Password reset succeeded for email=%s", client.email)
    return ResetPasswordResponse(
        success=True,
        message="Password reset successful. You can now sign in.",
    )


@router.post("/google", response_model=TokenResponse)
def google_auth(data: GoogleAuthRequest, db: Session = Depends(get_db)):
    """Authenticate or register a user via a Google OAuth access token.

    Verifies the token with Google's userinfo endpoint, then finds or creates
    a BusinessClient for the returned email address. Google-authenticated users
    are considered email-verified by Google, so no OTP step is required.
    """
    try:
        with httpx.Client(timeout=10) as http_client:
            resp = http_client.get(
                GOOGLE_USERINFO_URL,
                headers={"Authorization": f"Bearer {data.access_token}"},
            )
            resp.raise_for_status()
            user_info = resp.json()
    except httpx.HTTPStatusError:
        raise HTTPException(status_code=401, detail="Invalid or expired Google token.")
    except httpx.RequestError:
        raise HTTPException(status_code=502, detail="Could not reach Google auth servers.")

    email = user_info.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="Google account has no email address.")

    existing = get_by_email(db, email)
    if existing:
        # Ensure Google-linked accounts are always marked verified.
        if not existing.email_verified:
            mark_email_verified(db, existing)
        token = create_access_token(existing.id, existing.email)
        return TokenResponse(
            access_token=token,
            client_id=existing.id,
            email=existing.email,
            is_new_user=False,
        )

    name = user_info.get("name", "")
    new_client = create_business_client(db, email, None, "basic", business_name=name, auth_provider="google")
    # Google has already verified this email address.
    mark_email_verified(db, new_client)
    token = create_access_token(new_client.id, new_client.email)
    return TokenResponse(
        access_token=token,
        client_id=new_client.id,
        email=new_client.email,
        is_new_user=True,
    )


@router.get("/me", response_model=ProfileResponse)
def get_me(
    db: Session = Depends(get_db),
    client_id: int = Depends(get_current_client_id),
):
    """Return the authenticated user's profile."""
    client = get_by_id(db, client_id)
    if not client:
        raise HTTPException(status_code=404, detail="Business client not found.")
    if not client.email_verified:
        raise HTTPException(status_code=403, detail="Email verification is required.")
    traits = json.loads(client.traits) if client.traits else None
    return ProfileResponse(
        client_id=client.id,
        email=client.email,
        business_name=client.business_name,
        subscription_tier=client.subscription_tier,
        credits_balance=client.credits_balance,
        traits=traits,
        auth_provider=client.auth_provider,
    )


@router.post("/onboarding", response_model=OnboardingResponse)
def save_onboarding(
    data: OnboardingRequest,
    db: Session = Depends(get_db),
    client_id: int = Depends(get_current_client_id),
):
    """Save all four onboarding steps for the authenticated business client.

    Accepts a partial payload — only provided fields are updated, so the
    frontend can call this once at the end with the full formData object.
    """
    existing_client = get_by_id(db, client_id)
    if not existing_client:
        raise HTTPException(status_code=404, detail="Business client not found.")
    if not existing_client.email_verified:
        raise HTTPException(status_code=403, detail="Email verification is required.")

    client = update_onboarding(db, client_id, data)
    if not client:
        raise HTTPException(status_code=404, detail="Business client not found.")
    return OnboardingResponse(
        success=True,
        client_id=client.id,
        message="Onboarding data saved successfully.",
    )
