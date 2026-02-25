import { apiUrl, authHeaders } from './config';
import type {
  Campaign,
  CreateCampaignPayload,
  UpdateCampaignPayload
} from '../types';

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

export async function deleteCampaign(campaignId: number): Promise<void> {
  const res = await fetch(apiUrl(`/campaigns/${campaignId}`), {
    method: 'DELETE',
    headers: authHeaders(),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || 'Failed to delete campaign.');
  }
}
