"""Pydantic schemas for authentication and onboarding."""

from typing import List, Optional
from pydantic import BaseModel


class SignUpRequest(BaseModel):
    email: str
    password: str
    plan: str = "basic"


class SignInRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    client_id: int
    email: str


class OnboardingRequest(BaseModel):
    # Step 1 – company info
    company_name: Optional[str] = None
    industry: Optional[str] = None
    company_size: Optional[str] = None
    website: Optional[str] = None
    # Step 2 – product & audience
    product_description: Optional[str] = None
    target_customer: Optional[str] = None
    # Step 3 – marketing goals
    primary_goal: Optional[str] = None
    custom_goal: Optional[str] = None
    target_platforms: Optional[List[str]] = None
    target_regions: Optional[List[str]] = None
    # Step 4 – current strategy
    ad_spend: Optional[str] = None
    current_tools: Optional[List[str]] = None
    biggest_challenge: Optional[str] = None
    other_tools: Optional[str] = None


class OnboardingResponse(BaseModel):
    success: bool
    client_id: int
    message: str
