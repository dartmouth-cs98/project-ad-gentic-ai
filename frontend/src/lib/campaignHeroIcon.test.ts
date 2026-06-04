import { describe, it, expect } from 'vitest';
import { normalizeCampaignHeroIcon, getHeroIconStyles, HERO_ICON_STYLES } from './campaignHeroIcon';

describe('normalizeCampaignHeroIcon', () => {
  it('preserves known icon strings', () => {
    expect(normalizeCampaignHeroIcon('users')).toBe('users');
    expect(normalizeCampaignHeroIcon('globe')).toBe('globe');
  });

  it('falls back to chart for unknown or invalid values', () => {
    expect(normalizeCampaignHeroIcon('new_icon_from_api')).toBe('chart');
    expect(normalizeCampaignHeroIcon('')).toBe('chart');
    expect(normalizeCampaignHeroIcon(null)).toBe('chart');
    expect(normalizeCampaignHeroIcon(undefined)).toBe('chart');
    expect(normalizeCampaignHeroIcon(1)).toBe('chart');
  });
});

describe('getHeroIconStyles', () => {
  it('returns stable styles for any input', () => {
    expect(getHeroIconStyles('not_a_real_icon').wrap).toBe(HERO_ICON_STYLES.chart.wrap);
    expect(getHeroIconStyles('not_a_real_icon').iconClass).toBe(HERO_ICON_STYLES.chart.iconClass);
  });
});
