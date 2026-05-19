import type { FilterState } from '../hooks/useFilterState';

/** Persisted with campaign brief per version; snake_case matches backend `GenerationPreferences`. */
export interface GenerationPreferences {
  personalization_range: string;
  variants_per_group: number;
  ad_formats: string[];
  tone: string;
  budget_tier: string;
  cta_style: string;
  language: string;
  platforms: string[];
  color_mode: string;
  custom_color?: string;
}

/** Snapshot current filter panel for persistence at plan approval. */
export function buildGenerationPreferencesSnapshot(state: FilterState): GenerationPreferences {
  return {
    personalization_range: state.personalizationRange,
    variants_per_group: state.variantsPerGroup,
    ad_formats: Array.from(state.adFormats),
    tone: state.tone,
    budget_tier: state.budgetTier,
    cta_style: state.ctaStyle,
    language: state.language,
    platforms: Array.from(state.selectedPlatforms),
    color_mode: state.colorMode,
    ...(state.colorMode === 'custom' ? { custom_color: state.customColor } : {}),
  };
}
