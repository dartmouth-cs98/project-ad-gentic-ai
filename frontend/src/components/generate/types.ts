// Shared types for generate components
// These are UI-only types used by the mock-driven ad generation flow.
// They will be replaced by backend API types once the generation endpoint exists.

export type AdFormat = 'image' | 'video' | 'carousel';
export type Phase = 'idle' | 'generating' | 'results';

export interface Variant {
  id: string;
  headline: string;
  description: string;
  image: string;
  format: AdFormat;
  score: number;
  subProfile: string;
}

export interface PersonaGroup {
  id: string;
  name: string;
  ageRange: string;
  description: string;
  color: string;
  colorBg: string;
  colorText: string;
  colorBorder: string;
  variants: Variant[];
}

export interface Version {
  id: string;
  label: string;
  timestamp: string;
  variantCount: number;
}
