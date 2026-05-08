/** Brief persona info embedded in consumer records. */
export interface PersonaBrief {
    id: string;
    name: string;
}

/** Full persona record returned by GET /personas/ */
export interface Persona {
    id: string;
    name: string;
    description: string;
    key_motivators: string[];
    pain_points: string[];
    ad_tone_preferences: string[] | null;
    created_at: string | null;
}

/** Summary returned after running persona assignment. */
export interface PersonaProcessingSummary {
    processed: number;
    failed: number;
    skipped: number;
    low_confidence: number;
}

/** Request body for POST /consumers/assign-personas */
export interface AssignPersonasRequest {
    consumer_ids?: number[] | null;
}
