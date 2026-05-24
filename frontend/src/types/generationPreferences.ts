import type { FilterState, PersonalizationRange, AdFormatOption, Tone, BudgetTier, CtaStyle, ColorMode } from '../hooks/useFilterState';
import { DEFAULT_FILTERS } from '../hooks/useFilterState';

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

const PERSONALIZATION_RANGES = new Set<PersonalizationRange>(['individual', 'group', 'broad']);
const AD_FORMATS = new Set<AdFormatOption>(['images', 'videos']);
const TONES = new Set<Tone>(['formal', 'playful', 'bold', 'minimal']);
const BUDGET_TIERS = new Set<BudgetTier>(['low', 'mid', 'premium']);
const CTA_STYLES = new Set<CtaStyle>(['soft', 'direct', 'urgency']);
const COLOR_MODES = new Set<ColorMode>(['brand', 'custom']);

function clampVariantsPerGroup(value: unknown): number {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return DEFAULT_FILTERS.variantsPerGroup;
  return Math.min(10, Math.max(1, Math.round(n)));
}

function asStringArray(value: unknown, allowed: Set<string>, fallback: string[]): string[] {
  if (!Array.isArray(value)) return [...fallback];
  const filtered = value.filter((item): item is string => typeof item === 'string' && allowed.has(item));
  return filtered.length > 0 ? filtered : [...fallback];
}

/** Preserve platform labels from persisted JSON; empty array means none selected. */
function parsePlatforms(value: unknown): Set<string> {
  if (!Array.isArray(value)) {
    return new Set(DEFAULT_FILTERS.selectedPlatforms);
  }
  const labels = value.filter(
    (item): item is string => typeof item === 'string' && item.trim().length > 0,
  );
  return new Set(labels);
}

/** Stable JSON order for set-backed fields (insertion order varies after toggles). */
function sortedSetValues(values: Set<string>): string[] {
  return [...values].sort((a, b) => a.localeCompare(b));
}

/** Snapshot current filter panel for persistence at plan approval or draft save. */
export function buildGenerationPreferencesSnapshot(state: FilterState): GenerationPreferences {
  return {
    personalization_range: state.personalizationRange,
    variants_per_group: state.variantsPerGroup,
    ad_formats: sortedSetValues(state.adFormats),
    tone: state.tone,
    budget_tier: state.budgetTier,
    cta_style: state.ctaStyle,
    language: state.language,
    platforms: sortedSetValues(state.selectedPlatforms),
    color_mode: state.colorMode,
    ...(state.colorMode === 'custom' ? { custom_color: state.customColor } : {}),
  };
}

/** Hydrate filter panel state from persisted preferences (draft or approved snapshot). */
export function parseGenerationPreferencesToFilterState(prefs: GenerationPreferences): FilterState {
  const personalizationRange = PERSONALIZATION_RANGES.has(prefs.personalization_range as PersonalizationRange)
    ? (prefs.personalization_range as PersonalizationRange)
    : DEFAULT_FILTERS.personalizationRange;

  const tone = TONES.has(prefs.tone as Tone) ? (prefs.tone as Tone) : DEFAULT_FILTERS.tone;
  const budgetTier = BUDGET_TIERS.has(prefs.budget_tier as BudgetTier)
    ? (prefs.budget_tier as BudgetTier)
    : DEFAULT_FILTERS.budgetTier;
  const ctaStyle = CTA_STYLES.has(prefs.cta_style as CtaStyle)
    ? (prefs.cta_style as CtaStyle)
    : DEFAULT_FILTERS.ctaStyle;

  const colorMode = COLOR_MODES.has(prefs.color_mode as ColorMode)
    ? (prefs.color_mode as ColorMode)
    : DEFAULT_FILTERS.colorMode;

  const adFormats = new Set(
    asStringArray(prefs.ad_formats, AD_FORMATS as Set<string>, Array.from(DEFAULT_FILTERS.adFormats)),
  ) as Set<AdFormatOption>;

  const selectedPlatforms = parsePlatforms(prefs.platforms);

  return {
    personalizationRange,
    variantsPerGroup: clampVariantsPerGroup(prefs.variants_per_group),
    adFormats,
    colorMode,
    customColor:
      typeof prefs.custom_color === 'string' && prefs.custom_color.trim()
        ? prefs.custom_color
        : DEFAULT_FILTERS.customColor,
    selectedPlatforms,
    tone,
    budgetTier,
    ctaStyle,
    language:
      typeof prefs.language === 'string' && prefs.language.trim()
        ? prefs.language
        : DEFAULT_FILTERS.language,
  };
}

/** Latest approved version's generation_preferences from campaign.brief JSON. */
export function resolveLatestApprovedGenerationPreferences(
  brief: string | null | undefined,
): GenerationPreferences | null {
  if (!brief?.trim()) return null;

  let data: unknown;
  try {
    data = JSON.parse(brief);
  } catch {
    return null;
  }

  if (!data || typeof data !== 'object' || Array.isArray(data)) return null;

  const versionNumbers = Object.keys(data as Record<string, unknown>)
    .map((key) => parseInt(key, 10))
    .filter((n) => Number.isFinite(n) && n > 0);

  if (versionNumbers.length === 0) return null;

  const latestVersion = Math.max(...versionNumbers);
  const entry = (data as Record<string, unknown>)[String(latestVersion)];
  if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return null;

  const prefs = (entry as Record<string, unknown>).generation_preferences;
  if (!prefs || typeof prefs !== 'object' || Array.isArray(prefs)) return null;

  return prefs as GenerationPreferences;
}

export function cloneDefaultFilterState(): FilterState {
  return {
    ...DEFAULT_FILTERS,
    adFormats: new Set(DEFAULT_FILTERS.adFormats),
    selectedPlatforms: new Set(DEFAULT_FILTERS.selectedPlatforms),
  };
}

export function preferencesSnapshotJson(state: FilterState): string {
  return JSON.stringify(buildGenerationPreferencesSnapshot(state));
}
