import { apiUrl, authHeaders, formatApiDetail } from './config';

/** Must match backend ``CampaignBulkDeleteRequest`` max_length. */
export const BULK_DELETE_MAX_CAMPAIGNS = 50;
import type {
  Campaign,
  CreateCampaignPayload,
  UpdateCampaignPayload,
} from '../types';
import type { GenerationPreferences } from '../types/generationPreferences';

// ---------- API calls ----------

export async function fetchCampaigns(
  businessClientId: number,
  status?: string,
): Promise<Campaign[]> {
  const params = new URLSearchParams({
    business_client_id: String(businessClientId),
  });
  if (status) params.set('status', status);

  const res = await fetch(apiUrl(`/campaigns/?${params.toString()}`), {
    headers: authHeaders(),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || 'Failed to fetch campaigns.');
  }

  return (await res.json()) as Campaign[];
}

export async function fetchCampaign(campaignId: number): Promise<Campaign> {
  const res = await fetch(apiUrl(`/campaigns/${campaignId}`), {
    headers: authHeaders(),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || 'Campaign not found.');
  }

  return (await res.json()) as Campaign;
}

export async function createCampaign(
  data: CreateCampaignPayload,
): Promise<Campaign> {
  const res = await fetch(apiUrl('/campaigns/'), {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || 'Failed to create campaign.');
  }

  return (await res.json()) as Campaign;
}

export async function updateCampaign(
  campaignId: number,
  data: UpdateCampaignPayload,
): Promise<Campaign> {
  const res = await fetch(apiUrl(`/campaigns/${campaignId}`), {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || 'Failed to update campaign.');
  }

  return (await res.json()) as Campaign;
}

export async function patchCampaignDraftPreferences(
  campaignId: number,
  prefs: GenerationPreferences,
): Promise<Campaign> {
  const res = await fetch(apiUrl(`/campaigns/${campaignId}/draft-generation-preferences`), {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify(prefs),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || 'Failed to save generation preferences.');
  }

  return (await res.json()) as Campaign;
}

export async function runCampaign(campaignId: number): Promise<Campaign> {
  const res = await fetch(apiUrl(`/campaigns/${campaignId}/run`), {
    method: 'PATCH',
    headers: authHeaders(),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || 'Failed to run campaign.');
  }
  return (await res.json()) as Campaign;
}

export interface CampaignBulkDeleteResponse {
  deleted_ids: number[];
  not_found_ids: number[];
}

export async function deleteCampaign(campaignId: number): Promise<void> {
  const res = await fetch(apiUrl(`/campaigns/${campaignId}`), {
    method: 'DELETE',
    headers: authHeaders(),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(formatApiDetail(body.detail, 'Failed to delete campaign.'));
  }
}

export async function deleteCampaignsBulk(
  campaignIds: number[],
): Promise<CampaignBulkDeleteResponse> {
  const res = await fetch(apiUrl('/campaigns/bulk-delete'), {
    method: 'POST',
    headers: {
      ...authHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ campaign_ids: campaignIds }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(formatApiDetail(body.detail, 'Failed to delete campaigns.'));
  }

  return (await res.json()) as CampaignBulkDeleteResponse;
}
