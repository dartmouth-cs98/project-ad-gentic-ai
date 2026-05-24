import { describe, it, expect } from 'vitest';
import { DEFAULT_FILTERS } from '../hooks/useFilterState';
import {
  buildGenerationPreferencesSnapshot,
  parseGenerationPreferencesToFilterState,
  preferencesSnapshotJson,
} from './generationPreferences';

describe('generationPreferences', () => {
  it('round-trips filter state', () => {
    const state = {
      ...DEFAULT_FILTERS,
      tone: 'playful' as const,
      variantsPerGroup: 2,
      adFormats: new Set(['images'] as const),
      selectedPlatforms: new Set(['TikTok Feed', 'LinkedIn Banner']),
    };
    const restored = parseGenerationPreferencesToFilterState(
      buildGenerationPreferencesSnapshot(state),
    );
    expect(restored.tone).toBe('playful');
    expect(restored.variantsPerGroup).toBe(2);
    expect(restored.adFormats.has('images')).toBe(true);
    expect(restored.selectedPlatforms.has('TikTok Feed')).toBe(true);
    expect(restored.selectedPlatforms.has('LinkedIn Banner')).toBe(true);
  });

  it('preserves non-default platforms from persisted JSON', () => {
    const prefs = {
      personalization_range: 'group',
      variants_per_group: 4,
      ad_formats: ['images', 'videos'],
      tone: 'bold',
      budget_tier: 'mid',
      cta_style: 'direct',
      language: 'English (US)',
      platforms: ['YouTube Pre-roll', 'TikTok Feed'],
      color_mode: 'brand',
    };
    const state = parseGenerationPreferencesToFilterState(prefs);
    expect(state.selectedPlatforms.has('YouTube Pre-roll')).toBe(true);
    expect(state.selectedPlatforms.has('TikTok Feed')).toBe(true);
    expect(state.selectedPlatforms.has('Facebook Feed')).toBe(false);
  });

  it('preserves empty platform list from persisted JSON', () => {
    const prefs = {
      personalization_range: 'group',
      variants_per_group: 4,
      ad_formats: ['images', 'videos'],
      tone: 'bold',
      budget_tier: 'mid',
      cta_style: 'direct',
      language: 'English (US)',
      platforms: [] as string[],
      color_mode: 'brand',
    };
    const state = parseGenerationPreferencesToFilterState(prefs);
    expect(state.selectedPlatforms.size).toBe(0);

    const roundTripped = parseGenerationPreferencesToFilterState(
      buildGenerationPreferencesSnapshot(state),
    );
    expect(roundTripped.selectedPlatforms.size).toBe(0);
  });

  it('preferencesSnapshotJson is stable for unchanged state', () => {
    const state = {
      ...DEFAULT_FILTERS,
      adFormats: new Set(DEFAULT_FILTERS.adFormats),
      selectedPlatforms: new Set(DEFAULT_FILTERS.selectedPlatforms),
    };
    expect(preferencesSnapshotJson(state)).toBe(preferencesSnapshotJson(state));
  });
});
