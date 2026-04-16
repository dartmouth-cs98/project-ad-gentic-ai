/**
 * JWT token response returned after sign-in.
 */
export interface TokenResponse {
    access_token: string;
    token_type: string;
    client_id: number;
    email: string;
    is_new_user?: boolean;
}

export interface SignUpResponse {
    success: boolean;
    email: string;
    message: string;
}

export interface VerifyEmailResponse {
    success: boolean;
    message: string;
    access_token: string;
    token_type: string;
    client_id: number;
    email: string;
}

export interface ResendVerificationResponse {
    success: boolean;
    message: string;
}

export interface RequestPasswordResetResponse {
    success: boolean;
    message: string;
}

export interface ResetPasswordResponse {
    success: boolean;
    message: string;
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
