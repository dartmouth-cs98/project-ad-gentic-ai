import { useReducer } from 'react';

// ─── Value types ─────────────────────────────────────────────────
export type PersonalizationRange = 'individual' | 'group' | 'broad';
export type AdFormatOption = 'images' | 'videos';
export type Tone = 'formal' | 'playful' | 'bold' | 'minimal';
export type BudgetTier = 'low' | 'mid' | 'premium';
export type CtaStyle = 'soft' | 'direct' | 'urgency';
export type ColorMode = 'brand' | 'custom';

// ─── State shape ─────────────────────────────────────────────────
export interface FilterState {
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
    case 'SET_RANGE':
      return { ...state, personalizationRange: action.payload };

    case 'SET_VARIANTS_PER_GROUP':
      return { ...state, variantsPerGroup: action.payload };

    case 'TOGGLE_FORMAT': {
      const next = new Set(state.adFormats);
      if (next.has(action.payload)) {
        // Don't allow deselecting the last format
        if (next.size > 1) next.delete(action.payload);
      } else {
        next.add(action.payload);
      }
      return { ...state, adFormats: next };
    }

    case 'SET_TONE':
      return { ...state, tone: action.payload };

    case 'SET_BUDGET':
      return { ...state, budgetTier: action.payload };

    case 'SET_CTA':
      return { ...state, ctaStyle: action.payload };

    case 'SET_LANGUAGE':
      return { ...state, language: action.payload };

    case 'SET_COLOR_MODE':
      return { ...state, colorMode: action.payload };

    case 'SET_CUSTOM_COLOR':
      return { ...state, customColor: action.payload };

    case 'TOGGLE_PLATFORM': {
      const next = new Set(state.selectedPlatforms);
      if (next.has(action.payload)) {
        next.delete(action.payload);
      } else {
        next.add(action.payload);
      }
      return { ...state, selectedPlatforms: next };
    }

    case 'RESET':
      return {
        ...DEFAULT_FILTERS,
        // Sets must be new instances to avoid shared references
        adFormats: new Set(DEFAULT_FILTERS.adFormats),
        selectedPlatforms: new Set(DEFAULT_FILTERS.selectedPlatforms),
      };

    default:
      return state;
  }
}

// ─── Hook ────────────────────────────────────────────────────────

/** Count how many filters differ from defaults. */
export function countActiveFilters(state: FilterState): number {
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
