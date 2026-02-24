import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchCampaigns,
  fetchCampaign,
  createCampaign,
  updateCampaign,
  deleteCampaign,
} from '../api/campaigns';
import type { CreateCampaignPayload, UpdateCampaignPayload } from '../api/campaigns';

export const CAMPAIGNS_KEY = ['campaigns'] as const;

/** Fetch all campaigns for a business client. */
export function useCampaigns(businessClientId: number | undefined, status?: string) {
  return useQuery({
    queryKey: [...CAMPAIGNS_KEY, businessClientId, status],
    queryFn: () => fetchCampaigns(businessClientId!, status),
    enabled: !!businessClientId,
    staleTime: 30_000, // 30 s
  });
}

/** Fetch a single campaign by ID. */
export function useCampaign(campaignId: number | undefined) {
  return useQuery({
    queryKey: [...CAMPAIGNS_KEY, campaignId],
    queryFn: () => fetchCampaign(campaignId!),
    enabled: !!campaignId,
  });
}

/** Create a new campaign. Invalidates the campaigns list on success. */
export function useCreateCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCampaignPayload) => createCampaign(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CAMPAIGNS_KEY });
    },
  });
}

/** Update an existing campaign. Invalidates the campaigns list on success. */
export function useUpdateCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ campaignId, data }: { campaignId: number; data: UpdateCampaignPayload }) =>
      updateCampaign(campaignId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CAMPAIGNS_KEY });
    },
  });
}

/** Delete a campaign. Invalidates the campaigns list on success. */
export function useDeleteCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (campaignId: number) => deleteCampaign(campaignId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CAMPAIGNS_KEY });
    },
  });
}
