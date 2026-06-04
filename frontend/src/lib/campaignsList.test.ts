import { describe, it, expect } from 'vitest';
import {
  parseProductContext,
  campaignToItem,
  distinctGoalsFromCampaigns,
  matchesDateRangePreset,
  filterCampaignsByDatePreset,
} from './campaignsList';
import type { Campaign } from '../types';

const baseCampaign = (over: Partial<Campaign>): Campaign => ({
  id: 1,
  business_client_id: 10,
  name: 'Test',
  status: 'draft',
  budget_total: null,
  start_date: null,
  end_date: null,
  goal: null,
  target_audience: null,
  product_context: null,
  created_at: '2026-01-15T12:00:00.000Z',
  updated_at: '2026-01-15T12:00:00.000Z',
  product_ids: null,
  brief: null,
  platforms: null,
  ...over,
});

describe('parseProductContext', () => {
  it('returns em dash for empty input', () => {
    expect(parseProductContext(null)).toBe('—');
    expect(parseProductContext(undefined)).toBe('—');
    expect(parseProductContext('')).toBe('—');
  });

  it('parses JSON object with text', () => {
    expect(parseProductContext('{"text":"Widget"}')).toBe('Widget');
  });

  it('returns raw string when JSON is invalid', () => {
    expect(parseProductContext('plain')).toBe('plain');
  });
});

describe('campaignToItem', () => {
  it('maps API fields and uses dash for missing goal', () => {
    const item = campaignToItem(
      baseCampaign({ id: 42, name: 'N', goal: null, created_at: '2026-03-01T00:00:00.000Z' }),
      'en-US',
    );
    expect(item.id).toBe('42');
    expect(item.name).toBe('N');
    expect(item.objective).toBe('—');
    expect(item.dateCreated).toMatch(/2026/);
  });

  it('trims goal', () => {
    const item = campaignToItem(baseCampaign({ goal: '  leads  ' }), 'en-US');
    expect(item.objective).toBe('leads');
  });
});

describe('distinctGoalsFromCampaigns', () => {
  it('returns sorted unique goals', () => {
    const goals = distinctGoalsFromCampaigns([
      baseCampaign({ id: 1, goal: 'z' }),
      baseCampaign({ id: 2, goal: 'a' }),
      baseCampaign({ id: 3, goal: 'a' }),
      baseCampaign({ id: 4, goal: null }),
    ]);
    expect(goals).toEqual(['a', 'z']);
  });
});

describe('matchesDateRangePreset', () => {
  it('all time matches any campaign', () => {
    const c = baseCampaign({ created_at: '2000-01-01T00:00:00.000Z' });
    expect(matchesDateRangePreset(c, 'all', Date.UTC(2026, 0, 1))).toBe(true);
  });

  it('30d excludes older campaigns', () => {
    const now = Date.UTC(2026, 3, 16, 12, 0, 0);
    const recent = baseCampaign({ created_at: new Date(now - 5 * 86400000).toISOString() });
    const old = baseCampaign({ id: 2, created_at: new Date(now - 40 * 86400000).toISOString() });
    expect(matchesDateRangePreset(recent, '30d', now)).toBe(true);
    expect(matchesDateRangePreset(old, '30d', now)).toBe(false);
  });
});

describe('filterCampaignsByDatePreset', () => {
  it('filters list', () => {
    const now = Date.UTC(2026, 0, 10, 0, 0, 0);
    const a = baseCampaign({ id: 1, created_at: new Date(now - 2 * 86400000).toISOString() });
    const b = baseCampaign({ id: 2, created_at: new Date(now - 20 * 86400000).toISOString() });
    expect(filterCampaignsByDatePreset([a, b], '7d', now)).toEqual([a]);
  });
});
