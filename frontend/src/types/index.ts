/**
 * JWT token response returned after sign-up / sign-in
*/
export interface TokenResponse {
    access_token: string;
    token_type: string;
    client_id: number;
    email: string;
}

/**
 * Authenticated user profile returned by GET /auth/me.
*/
export interface UserProfile {
    client_id: number;
    email: string;
    business_name: string;
    subscription_tier: string;
    credits_balance: number;
    traits: Record<string, unknown> | null;
}

/**
 * Minimal user reference (email + id).
*/
export interface User {
    email: string;
    client_id: number;
}

/**
 * Payload sent during the onboarding wizard.
*/
export interface OnboardingPayload {
    company_name?: string;
    industry?: string;
    company_size?: string;
    website?: string;
    product_description?: string;
    target_customer?: string;
    primary_goal?: string;
    custom_goal?: string;
    target_platforms?: string[];
    target_regions?: string[];
    ad_spend?: string;
    current_tools?: string[];
    biggest_challenge?: string;
    other_tools?: string;
}

/**
 * Consumer traits used for ad targeting and persona segmentation.
 * All fields are optional — each CSV row may contain a different subset.
*/
export interface ConsumerTraits {
    age_range?: string;
    gender?: string;
    location?: string;
    income_bracket?: string;
    interests?: string[];
    preferred_platforms?: string[];
    purchase_behavior?: string;
    engagement_level?: string;
    acquisition_source?: string;
    avg_order_value?: number;
    lifetime_value?: number;
    [key: string]: unknown; // incase of extra keys in the CSV
}

/** 
 * A single consumer record returned by the API. 
*/
export interface Consumer {
    id: number;
    email: string;
    phone: string;
    first_name: string;
    last_name: string;
    traits: ConsumerTraits | null;
    created_at: string;
    updated_at: string;
}

/** 
 * Summary returned after a CSV upload. 
*/
export interface ConsumerUploadResponse {
    created: number;
    skipped: number;
    skipped_emails: string[];
    errors: string[];
}
