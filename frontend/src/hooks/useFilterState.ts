import { useReducer } from 'react';

// ─── Value types ─────────────────────────────────────────────────
export type PersonalizationRange = 'individual' | 'group' | 'broad';
export type AdFormatOption = 'images' | 'videos';
export type Tone = 'formal' | 'playful' | 'bold' | 'minimal';
export type BudgetTier = 'low' | 'mid' | 'premium';
export type CtaStyle = 'soft' | 'direct' | 'urgency';
export type ColorMode = 'brand' | 'custom';
export type PresetKey = 'performance' | 'awareness' | 'engagement';

// ─── Presets ─────────────────────────────────────────────────────
export interface PresetDefinition {
  label: string;
  description: string;
  tone: Tone;
  budgetTier: BudgetTier;
  ctaStyle: CtaStyle;
  personalizationRange: PersonalizationRange;
  platforms: string[];
  adFormats: AdFormatOption[];
  variantsPerGroup: number;
}

export const PRESETS: Record<PresetKey, PresetDefinition> = {
  performance: {
    label: 'Performance',
    description: 'High-converting direct response',
    tone: 'bold',
    budgetTier: 'mid',
    ctaStyle: 'direct',
    personalizationRange: 'group',
    platforms: ['Facebook Feed', 'Instagram Story'],
    adFormats: ['images', 'videos'],
    variantsPerGroup: 4,
  },
  awareness: {
    label: 'Awareness',
    description: 'Broad reach, brand building',
    tone: 'formal',
    budgetTier: 'premium',
    ctaStyle: 'soft',
    personalizationRange: 'broad',
    platforms: ['Facebook Feed', 'LinkedIn Banner'],
    adFormats: ['images', 'videos'],
    variantsPerGroup: 3,
  },
  engagement: {
    label: 'Engagement',
    description: 'Social sharing & interaction',
    tone: 'playful',
    budgetTier: 'low',
    ctaStyle: 'soft',
    personalizationRange: 'individual',
    platforms: ['Instagram Story', 'TikTok Feed'],
    adFormats: ['videos'],
    variantsPerGroup: 4,
  },
};

// ─── State shape ─────────────────────────────────────────────────
export interface FilterState {
  activePreset: PresetKey | null;
  personalizationRange: PersonalizationRange;
  variantsPerGroup: number;
  adFormats: Set<AdFormatOption>;
  colorMode: ColorMode;
  customColor: string;
  selectedPlatforms: Set<string>;
  tone: Tone;
  budgetTier: BudgetTier;
  ctaStyle: CtaStyle;
  language: string;
}

// ─── Defaults ────────────────────────────────────────────────────
export const DEFAULT_FILTERS: FilterState = {
  activePreset: 'performance',
  personalizationRange: 'group',
  variantsPerGroup: 4,
  adFormats: new Set<AdFormatOption>(['images', 'videos']),
  colorMode: 'brand',
  customColor: '#3B82F6',
  selectedPlatforms: new Set(['Facebook Feed', 'Instagram Story']),
  tone: 'bold',
  budgetTier: 'mid',
  ctaStyle: 'direct',
  language: 'English (US)',
};

// ─── Actions ─────────────────────────────────────────────────────
export type FilterAction =
  | { type: 'SET_PRESET'; payload: PresetKey }
  | { type: 'SET_RANGE'; payload: PersonalizationRange }
  | { type: 'SET_VARIANTS_PER_GROUP'; payload: number }
  | { type: 'TOGGLE_FORMAT'; payload: AdFormatOption }
  | { type: 'SET_TONE'; payload: Tone }
  | { type: 'SET_BUDGET'; payload: BudgetTier }
  | { type: 'SET_CTA'; payload: CtaStyle }
  | { type: 'SET_LANGUAGE'; payload: string }
  | { type: 'SET_COLOR_MODE'; payload: ColorMode }
  | { type: 'SET_CUSTOM_COLOR'; payload: string }
  | { type: 'TOGGLE_PLATFORM'; payload: string }
  | { type: 'RESET' };

// ─── Reducer ─────────────────────────────────────────────────────
function filterReducer(state: FilterState, action: FilterAction): FilterState {
  switch (action.type) {
    case 'SET_PRESET': {
      const p = PRESETS[action.payload];
      return {
        ...state,
        activePreset: action.payload,
        tone: p.tone,
        budgetTier: p.budgetTier,
        ctaStyle: p.ctaStyle,
        personalizationRange: p.personalizationRange,
        selectedPlatforms: new Set(p.platforms),
        adFormats: new Set(p.adFormats),
        variantsPerGroup: p.variantsPerGroup,
      };
    }

    case 'SET_RANGE':
      return { ...state, activePreset: null, personalizationRange: action.payload };

    case 'SET_VARIANTS_PER_GROUP':
      return { ...state, activePreset: null, variantsPerGroup: action.payload };

    case 'TOGGLE_FORMAT': {
      const next = new Set(state.adFormats);
      if (next.has(action.payload)) {
        // Don't allow deselecting the last format
        if (next.size > 1) next.delete(action.payload);
      } else {
        next.add(action.payload);
      }
      return { ...state, activePreset: null, adFormats: next };
    }

    case 'SET_TONE':
      return { ...state, activePreset: null, tone: action.payload };

    case 'SET_BUDGET':
      return { ...state, activePreset: null, budgetTier: action.payload };

    case 'SET_CTA':
      return { ...state, activePreset: null, ctaStyle: action.payload };

    case 'SET_LANGUAGE':
      return { ...state, activePreset: null, language: action.payload };

    case 'SET_COLOR_MODE':
      return { ...state, activePreset: null, colorMode: action.payload };

    case 'SET_CUSTOM_COLOR':
      // Color picker doesn't clear the preset — presets don't specify colors
      return { ...state, customColor: action.payload };

    case 'TOGGLE_PLATFORM': {
      const next = new Set(state.selectedPlatforms);
      if (next.has(action.payload)) {
        next.delete(action.payload);
      } else {
        next.add(action.payload);
      }
      return { ...state, activePreset: null, selectedPlatforms: next };
    }

    case 'RESET':
      return {
        ...DEFAULT_FILTERS,
        adFormats: new Set(DEFAULT_FILTERS.adFormats),
        selectedPlatforms: new Set(DEFAULT_FILTERS.selectedPlatforms),
      };

    default:
      return state;
  }
}

// ─── Hook ────────────────────────────────────────────────────────

/** Count how many filters differ from defaults. Returns 0 when a preset is active. */
export function countActiveFilters(state: FilterState): number {
  if (state.activePreset !== null) return 0;
  return [
    state.personalizationRange !== DEFAULT_FILTERS.personalizationRange,
    state.variantsPerGroup !== DEFAULT_FILTERS.variantsPerGroup,
    !(state.adFormats.size === 2 && state.adFormats.has('images') && state.adFormats.has('videos')),
    state.colorMode !== DEFAULT_FILTERS.colorMode,
    state.tone !== DEFAULT_FILTERS.tone,
    state.budgetTier !== DEFAULT_FILTERS.budgetTier,
    state.ctaStyle !== DEFAULT_FILTERS.ctaStyle,
    state.language !== DEFAULT_FILTERS.language,
    !(state.selectedPlatforms.size === 2 &&
      state.selectedPlatforms.has('Facebook Feed') &&
      state.selectedPlatforms.has('Instagram Story')),
  ].filter(Boolean).length;
}

export function useFilterState() {
  return useReducer(filterReducer, {
    ...DEFAULT_FILTERS,
    adFormats: new Set(DEFAULT_FILTERS.adFormats),
    selectedPlatforms: new Set(DEFAULT_FILTERS.selectedPlatforms),
  });
}
