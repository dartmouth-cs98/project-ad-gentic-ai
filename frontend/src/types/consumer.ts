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
    [key: string]: unknown;
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
    primary_persona: { id: string; name: string } | null;
    secondary_persona: { id: string; name: string } | null;
    persona_confidence: number | null;
    persona_assigned_at: string | null;
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
