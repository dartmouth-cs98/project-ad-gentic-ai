/** Shape returned by GET /ad-variants */
export interface AdVariant {
  id: number;
  campaign_id: number;
  consumer_id: number | null;
  product_id: number | null;
  status: 'Generating' | 'completed' | 'failed';
  media_url: string | null;
  meta: string | null;
  version_number: number;
  is_preview: boolean;
  is_approved: boolean;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  /** Persona resolved via Consumer.primary_persona — null when no consumer or no assignment. */
  persona_id: string | null;
  persona_name: string | null;
}

/** Parsed script stored in AdVariant.meta JSON */
export interface AdVariantScript {
  script?: string;
  error?: string;
}
