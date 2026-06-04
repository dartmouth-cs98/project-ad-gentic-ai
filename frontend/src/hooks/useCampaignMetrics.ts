import { useQuery } from '@tanstack/react-query';
import { fetchCampaignMetrics } from '../api/metrics';

export function useCampaignMetrics(campaignId: number, enabled = true) {
  return useQuery({
    queryKey: ['campaigns', campaignId, 'metrics'],
    queryFn: () => fetchCampaignMetrics(campaignId),
    enabled: enabled && !!campaignId,
    staleTime: 15 * 60 * 1000,  // 15 min — matches backend stale threshold
  });
}
