import { apiUrl, authHeaders } from './config';

export interface CampaignMetricDay {
  id: number;
  campaign_id: number;
  meta_campaign_id: string | null;
  date: string;
  impressions: number | null;
  reach: number | null;
  clicks: number | null;
  spend: string | null;
  ctr: string | null;
  cpc: string | null;
  conversions: number | null;
  fetched_at: string;
}

export interface MetricsSummary {
  total_impressions: number;
  total_reach: number;
  total_clicks: number;
  total_spend: string;
  avg_ctr: string | null;
  avg_cpc: string | null;
  total_conversions: number;
  days: CampaignMetricDay[];
  last_fetched_at: string | null;
}

export async function fetchCampaignMetrics(campaignId: number): Promise<MetricsSummary> {
  const res = await fetch(apiUrl(`/campaigns/${campaignId}/metrics`), {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch campaign metrics');
  return res.json();
}
