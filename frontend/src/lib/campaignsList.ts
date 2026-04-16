import type { Campaign } from '../types';

/**
 * product_context is stored as a JSON object {"text": "..."} in the DB
 * (Azure SQL's ISJSON() only accepts objects/arrays, not scalar strings).
 * Fall back gracefully for any other shape.
 */
export function parseProductContext(raw: string | null | undefined): string {
  if (!raw) return '—';
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      const o = parsed as Record<string, unknown>;
      return String(o.text ?? o.description ?? JSON.stringify(parsed));
    }
    if (typeof parsed === 'string') return parsed;
    return String(parsed);
  } catch {
    return raw;
  }
}

export interface CampaignListItem {
  id: string;
  name: string;
  product: string;
  status: Campaign['status'];
  objective: string;
  dateCreated: string;
  thumbnail?: string;
}

export function campaignToItem(c: Campaign, dateLocale?: string | string[]): CampaignListItem {
  return {
    id: String(c.id),
    name: c.name,
    product: parseProductContext(c.product_context),
    status: c.status,
    objective: c.goal?.trim() || '—',
    dateCreated: new Date(c.created_at).toLocaleDateString(dateLocale, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }),
  };
}

/** Distinct non-empty goal strings from loaded campaigns (for filter checkboxes). */
export function distinctGoalsFromCampaigns(campaigns: Campaign[]): string[] {
  const set = new Set<string>();
  for (const c of campaigns) {
    const g = c.goal?.trim();
    if (g) set.add(g);
  }
  return [...set].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
}

export type DateRangePreset = '7d' | '30d' | '90d' | 'all';

export function matchesDateRangePreset(
  c: Campaign,
  preset: DateRangePreset,
  nowMs: number = Date.now(),
): boolean {
  if (preset === 'all') return true;
  const created = new Date(c.created_at).getTime();
  const days = preset === '7d' ? 7 : preset === '30d' ? 30 : 90;
  const cutoff = nowMs - days * 24 * 60 * 60 * 1000;
  return created >= cutoff;
}

export function filterCampaignsByDatePreset(campaigns: Campaign[], preset: DateRangePreset, nowMs?: number): Campaign[] {
  return campaigns.filter((c) => matchesDateRangePreset(c, preset, nowMs));
}
