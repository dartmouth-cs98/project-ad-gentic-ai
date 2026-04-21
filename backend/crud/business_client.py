"""CRUD helpers for the BusinessClient model."""

import json
from datetime import datetime, timezone
from sqlalchemy.orm import Session

from models.business_client import BusinessClient
from schemas.auth import OnboardingRequest


def get_by_email(db: Session, email: str) -> BusinessClient | None:
    return db.query(BusinessClient).filter(BusinessClient.email == email.lower()).first()


def get_by_id(db: Session, client_id: int) -> BusinessClient | None:
    return db.query(BusinessClient).filter(BusinessClient.id == client_id).first()


def create_business_client(
    db: Session, email: str, password_hash: str, plan: str,
    business_name: str = "",
    email_verification_token_hash: str | None = None,
    email_verification_expires_at: datetime | None = None,
    auth_provider: str = "email",
) -> BusinessClient:
    # Ensure business_name is populated with a non-empty value.
    # If no name is provided, default to using the email as an identifier.
    normalized_business_name = business_name.strip() if business_name is not None else ""
    if not normalized_business_name:
        normalized_business_name = email

    client = BusinessClient(
        email=email.lower(),
        password_hash=password_hash,
        business_name=normalized_business_name,
        subscription_tier=plan,
        credits_balance=0,
        email_verified=False,
        email_verification_token_hash=email_verification_token_hash,
        email_verification_expires_at=email_verification_expires_at,
        auth_provider=auth_provider,
    )
    db.add(client)
    db.commit()
    db.refresh(client)
    return client


def get_by_verification_token_hash(db: Session, token_hash: str) -> BusinessClient | None:
    return db.query(BusinessClient).filter(BusinessClient.email_verification_token_hash == token_hash).first()


def mark_email_verified(db: Session, client: BusinessClient) -> BusinessClient:
    client.email_verified = True
    client.email_verification_token_hash = None
    client.email_verification_expires_at = None
    db.commit()
    db.refresh(client)
    return client


def set_verification_token(
    db: Session,
    client: BusinessClient,
    token_hash: str,
    expires_at: datetime,
) -> BusinessClient:
    client.email_verification_token_hash = token_hash
    client.email_verification_expires_at = expires_at
    db.commit()
    db.refresh(client)
    return client


def is_verification_token_expired(client: BusinessClient) -> bool:
    if not client.email_verification_expires_at:
        return True
    expires_at = client.email_verification_expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    return expires_at < datetime.now(timezone.utc)


def set_password_reset_token(
    db: Session,
    client: BusinessClient,
    token_hash: str,
    expires_at: datetime,
) -> BusinessClient:
    client.password_reset_token_hash = token_hash
    client.password_reset_expires_at = expires_at
    db.commit()
    db.refresh(client)
    return client


def clear_password_reset_token(db: Session, client: BusinessClient) -> BusinessClient:
    client.password_reset_token_hash = None
    client.password_reset_expires_at = None
    db.commit()
    db.refresh(client)
    return client


def is_password_reset_token_expired(client: BusinessClient) -> bool:
    if not client.password_reset_expires_at:
        return True
    expires_at = client.password_reset_expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    return expires_at < datetime.now(timezone.utc)


def update_onboarding(
    db: Session, client_id: int, data: OnboardingRequest
) -> BusinessClient | None:
    """Persist onboarding data on business_clients.

    - company_name → business_clients.business_name
    - Everything else → business_clients.traits (JSON blob)
    """
    client = get_by_id(db, client_id)
    if not client:
        return None

    if data.company_name is not None:
        client.business_name = data.company_name

    # Build traits dict from onboarding fields
    traits: dict = {}
    if data.industry is not None:
        traits["industry"] = data.industry
    if data.company_size is not None:
        traits["company_size"] = data.company_size
    if data.website is not None:
        traits["website"] = data.website
    if data.product_description is not None:
        traits["product_description"] = data.product_description
    if data.target_customer is not None:
        traits["target_customer"] = data.target_customer
    if data.primary_goal is not None:
        traits["primary_goal"] = data.primary_goal
    if data.custom_goal is not None:
        traits["custom_goal"] = data.custom_goal
    if data.target_platforms is not None:
        traits["target_platforms"] = data.target_platforms
    if data.target_regions is not None:
        traits["target_regions"] = data.target_regions
    if data.ad_spend is not None:
        traits["ad_spend"] = data.ad_spend
    if data.current_tools is not None:
        traits["current_tools"] = data.current_tools
    if data.biggest_challenge is not None:
        traits["biggest_challenge"] = data.biggest_challenge
    if data.other_tools is not None:
        traits["other_tools"] = data.other_tools

    # Merge into existing traits on business_clients
    if traits:
        existing = json.loads(client.traits) if client.traits else {}
        existing.update(traits)
        client.traits = json.dumps(existing)

    db.commit()
    db.refresh(client)
    return client
