import { apiUrl, authHeaders } from './config';
import type { AdVariant } from '../types';

export interface GenerationCreditsInfo {
  credits_balance: number;
  credits_remaining?: number;
  credits_daily_cap: number;
  credits_charged?: number;
  credits_reserved?: number;
}

function generationErrorMessage(body: unknown, fallback: string): string {
  if (!body || typeof body !== 'object') return fallback;
  const detail = (body as { detail?: unknown }).detail;
  if (typeof detail === 'string' && detail.trim()) return detail;
  if (detail && typeof detail === 'object') {
    const d = detail as {
      detail?: string;
      required?: number;
      available?: number;
      daily_cap?: number;
    };
    if (d.detail === 'Insufficient credits') {
      return `Not enough credits (${d.available ?? 0} of ${d.daily_cap ?? '?'} left). This run needs ${d.required ?? '?'}.`;
    }
  }
  return fallback;
}

// ---------- Ad Generation ----------

/** Trigger preview generation (synchronous — returns when all variants are done). */
export async function generateCampaignPreview(
  campaignId: number,
  productId: number,
  versionNumber: number,
): Promise<{ status: string; ad_variant_ids: number[] } & GenerationCreditsInfo> {
  const params = new URLSearchParams({
    campaign_id: String(campaignId),
    product_id: String(productId),
    version_number: String(versionNumber),
  });

  const res = await fetch(apiUrl(`/ad-generation/generate-campaign-preview?${params}`), {
    method: 'POST',
    headers: authHeaders(),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(generationErrorMessage(body, 'Failed to generate campaign preview.'));
  }

  return res.json();
}

/** Trigger full ad generation (async — returns batch ID). */
export async function generateCampaignAdVariants(
  campaignId: number,
  productId: number,
  versionNumber: number,
): Promise<{ status: string; batch_id?: string; message: string }> {
  const params = new URLSearchParams({
    campaign_id: String(campaignId),
    product_id: String(productId),
    version_number: String(versionNumber),
  });

  const res = await fetch(apiUrl(`/ad-generation/generate-campaign-ad-variants?${params}`), {
    method: 'POST',
    headers: authHeaders(),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(generationErrorMessage(body, 'Failed to generate campaign ad variants.'));
  }

  return res.json();
}

// ---------- Ad Variant approval ----------

/** Approve a single ad variant. */
export async function approveAdVariant(variantId: number): Promise<AdVariant> {
  const res = await fetch(apiUrl(`/ad-variants/${variantId}/approve`), {
    method: 'PATCH',
    headers: authHeaders(),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || 'Failed to approve variant.');
  }
  return (await res.json()) as AdVariant;
}

/** Revoke approval on a single ad variant. */
export async function unapproveAdVariant(variantId: number): Promise<AdVariant> {
  const res = await fetch(apiUrl(`/ad-variants/${variantId}/unapprove`), {
    method: 'PATCH',
    headers: authHeaders(),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || 'Failed to unapprove variant.');
  }
  return (await res.json()) as AdVariant;
}

// ---------- Ad Variants ----------

/** Fetch ad variants for a campaign, with optional filters. */
export async function fetchAdVariants(
  campaignId: number,
  opts?: { status?: string; isPreview?: boolean },
): Promise<AdVariant[]> {
  const params = new URLSearchParams({ campaign_id: String(campaignId) });
  if (opts?.status) params.set('status', opts.status);
  if (opts?.isPreview !== undefined) params.set('is_preview', String(opts.isPreview));

  const res = await fetch(apiUrl(`/ad-variants/?${params}`), {
    headers: authHeaders(),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || 'Failed to fetch ad variants.');
  }

  return (await res.json()) as AdVariant[];
}
