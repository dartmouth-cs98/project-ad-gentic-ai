export type BrandConfidence = 'low' | 'medium' | 'high';

export interface TestimonialExtract {
  quote: string;
  attribution?: string | null;
}

export interface FaqExtract {
  question: string;
  answer: string;
}

export interface PricingExtract {
  display?: string | null;
  amount?: number | null;
  currency?: string | null;
}

export interface ImageCandidate {
  url: string;
  alt?: string | null;
  linked_product_slug?: string | null;
}

export interface BrandExtract {
  name?: string | null;
  tone?: 'formal' | 'playful' | 'bold' | 'minimal' | null;
  tone_notes?: string | null;
  value_propositions: string[];
  target_customer_assumptions?: string | null;
  testimonials: TestimonialExtract[];
  faqs: FaqExtract[];
  offers: string[];
  hero_image_url?: string | null;
}

export interface ProductExtract {
  name: string;
  description?: string | null;
  product_url?: string | null;
  value_propositions: string[];
  pricing?: PricingExtract | null;
  offers: string[];
  image_candidates: ImageCandidate[];
}

export interface PageExtractionMeta {
  url: string;
  page_type: string;
  text_chars: number;
  text_raw_chars?: number;
  text_extractor?: string;
  had_json_ld: boolean;
  json_ld_types: string[];
  structured_product_count: number;
}

export interface ExtractionMeta {
  pages: PageExtractionMeta[];
  structured_product_seeds: number;
}

export interface BrandImportPreview {
  source_url: string;
  fetched_pages: string[];
  brand: BrandExtract;
  products: ProductExtract[];
  warnings: string[];
  confidence: BrandConfidence;
  extraction_meta?: ExtractionMeta | null;
}

export interface BrandImportApplyRequest {
  preview: BrandImportPreview;
  create_products?: boolean;
  selected_product_indexes?: number[];
  selected_images?: Record<string, number[]>;
  merge_onboarding_traits?: boolean;
}

export interface ProductImportResult {
  product_id: number;
  name: string;
  image_errors: string[];
}

export interface BrandImportApplyResponse {
  brand_profile_saved: boolean;
  products_created: ProductImportResult[];
  traits_updated: boolean;
}

export interface BrandImportLimits {
  enabled: boolean;
  max_analyzes_per_hour: number;
  remaining_analyzes_this_hour: number;
}
