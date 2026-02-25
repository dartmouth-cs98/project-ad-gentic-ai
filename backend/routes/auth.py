"""Auth and onboarding routes — signup, signin, and onboarding data persistence."""

import json
import os
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from jose import jwt, JWTError

from database import get_db
from schemas.auth import (
    SignUpRequest,
    SignInRequest,
    TokenResponse,
    ProfileResponse,
    OnboardingRequest,
    OnboardingResponse,
)
from crud.business_client import get_by_email, get_by_id, create_business_client, update_onboarding
from dependencies import get_current_client_id, create_access_token

router = APIRouter()

_pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
_bearer = HTTPBearer()

JWT_SECRET = os.getenv("JWT_SECRET")
if not JWT_SECRET:
    raise RuntimeError("JWT_SECRET environment variable must be set for JWT signing.")
JWT_ALGORITHM = "HS256"
JWT_EXPIRY_DAYS = 7


# --- Helpers ---

def _hash_password(plain: str) -> str:
    return _pwd_context.hash(plain)


def _verify_password(plain: str, hashed: str) -> bool:
    return _pwd_context.verify(plain, hashed)


# --- Endpoints ---

@router.post("/signup", response_model=TokenResponse, status_code=201)
def signup(data: SignUpRequest, db: Session = Depends(get_db)):
    """Register a new business client and return a JWT access token."""
    if get_by_email(db, data.email):
        raise HTTPException(
            status_code=409,
            detail="An account with this email already exists.",
        )
    hashed = _hash_password(data.password)
    client = create_business_client(db, data.email, hashed, data.plan)
    token = create_access_token(client.id, client.email)
    return TokenResponse(access_token=token, client_id=client.id, email=client.email)


@router.post("/signin", response_model=TokenResponse)
def signin(data: SignInRequest, db: Session = Depends(get_db)):
    """Authenticate a business client and return a JWT access token."""
    client = get_by_email(db, data.email)
    if (
        not client
        or not client.password_hash
        or not _verify_password(data.password, client.password_hash)
    ):
        raise HTTPException(status_code=401, detail="Invalid email or password.")
    token = create_access_token(client.id, client.email)
    return TokenResponse(access_token=token, client_id=client.id, email=client.email)


@router.get("/me", response_model=ProfileResponse)
def get_me(
    db: Session = Depends(get_db),
    client_id: int = Depends(get_current_client_id),
):
    """Return the authenticated user's profile."""
    client = get_by_id(db, client_id)
    if not client:
        raise HTTPException(status_code=404, detail="Business client not found.")
    traits = json.loads(client.traits) if client.traits else None
    return ProfileResponse(
        client_id=client.id,
        email=client.email,
        business_name=client.business_name,
        subscription_tier=client.subscription_tier,
        credits_balance=client.credits_balance,
        traits=traits,
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
    client = update_onboarding(db, client_id, data)
    if not client:
        raise HTTPException(status_code=404, detail="Business client not found.")
    return OnboardingResponse(
        success=True,
        client_id=client.id,
        message="Onboarding data saved successfully.",
    )
