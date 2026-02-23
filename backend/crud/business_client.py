"""CRUD helpers for the BusinessClient model."""

import json
from sqlalchemy.orm import Session

from models.business_client import BusinessClient
from schemas.auth import OnboardingRequest


def get_by_email(db: Session, email: str) -> BusinessClient | None:
    return db.query(BusinessClient).filter(BusinessClient.email == email.lower()).first()


def get_by_id(db: Session, client_id: int) -> BusinessClient | None:
    return db.query(BusinessClient).filter(BusinessClient.id == client_id).first()


def create_business_client(
    db: Session, email: str, password_hash: str, plan: str
) -> BusinessClient:
    client = BusinessClient(
        email=email.lower(),
        password_hash=password_hash,
        business_name=None,
        subscription_tier=plan,
        credits_balance=0,
        onboarding_completed=False,
    )
    db.add(client)
    db.commit()
    db.refresh(client)
    return client


def update_onboarding(
    db: Session, client_id: int, data: OnboardingRequest
) -> BusinessClient | None:
    client = get_by_id(db, client_id)
    if not client:
        return None

    if data.company_name is not None:
        client.business_name = data.company_name
    if data.industry is not None:
        client.industry = data.industry
    if data.company_size is not None:
        client.company_size = data.company_size
    if data.website is not None:
        client.website = data.website
    if data.product_description is not None:
        client.product_description = data.product_description
    if data.target_customer is not None:
        client.target_customer = data.target_customer
    if data.primary_goal is not None:
        client.primary_goal = data.primary_goal
    if data.custom_goal is not None:
        client.custom_goal = data.custom_goal
    if data.target_platforms is not None:
        client.target_platforms = json.dumps(data.target_platforms)
    if data.target_regions is not None:
        client.target_regions = json.dumps(data.target_regions)
    if data.ad_spend is not None:
        client.ad_spend = data.ad_spend
    if data.current_tools is not None:
        client.current_tools = json.dumps(data.current_tools)
    if data.biggest_challenge is not None:
        client.biggest_challenge = data.biggest_challenge
    if data.other_tools is not None:
        client.other_tools = data.other_tools

    client.onboarding_completed = True
    db.commit()
    db.refresh(client)
    return client
