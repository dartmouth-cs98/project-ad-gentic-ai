import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  generateCampaignPreview,
  generateCampaignAdVariants,
  fetchAdVariants,
} from '../api/adGeneration';
import { updateCampaign } from '../api/campaigns';
import type { UpdateCampaignPayload } from '../types';

export const AD_VARIANTS_KEY = ['ad-variants'] as const;

/** Fetch ad variants for a campaign, with optional status/preview filters. */
export function useCampaignAdVariants(
  campaignId: number | undefined,
  opts?: { enabled?: boolean; status?: string; isPreview?: boolean },
) {
  return useQuery({
    queryKey: [...AD_VARIANTS_KEY, campaignId, opts?.status ?? 'any', opts?.isPreview ?? 'any'],
    queryFn: () =>
      fetchAdVariants(campaignId!, {
        status: opts?.status,
        isPreview: opts?.isPreview,
      }),
    enabled: !!campaignId && (opts?.enabled ?? true),
  });
}

/** Fetch preview ad variants for a campaign. Polls every `refetchInterval` ms when enabled. */
export function usePreviewVariants(campaignId: number | undefined, enabled: boolean, refetchInterval?: number) {
  return useQuery({
    queryKey: [...AD_VARIANTS_KEY, campaignId, 'preview'],
    queryFn: () => fetchAdVariants(campaignId!, { isPreview: true }),
    enabled: !!campaignId && enabled,
    refetchInterval: refetchInterval || false,
  });
}

/** Trigger preview generation. Returns ad_variant_ids on success. */
export function useGeneratePreview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { campaignId: number; productId: number; versionNumber: number }) =>
      generateCampaignPreview(params.campaignId, params.productId, params.versionNumber),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: AD_VARIANTS_KEY });
    },
  });
}

/** Trigger full ad generation. Returns batch_id on success. */
export function useGenerateFullAds() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { campaignId: number; productId: number; versionNumber: number }) =>
      generateCampaignAdVariants(params.campaignId, params.productId, params.versionNumber),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: AD_VARIANTS_KEY });
    },
  });
}

/** Update campaign (e.g., to save brief). */
export function useUpdateCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { campaignId: number; data: UpdateCampaignPayload }) =>
      updateCampaign(params.campaignId, params.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['campaigns'] });
    },
  });
}
