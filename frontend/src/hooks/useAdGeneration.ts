import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  generateCampaignPreview,
  generateCampaignAdVariants,
  fetchAdVariants,
  approveAdVariant,
  unapproveAdVariant,
} from '../api/adGeneration';
import { updateCampaign, runCampaign } from '../api/campaigns';
import type { UpdateCampaignPayload } from '../types';

export const AD_VARIANTS_KEY = ['ad-variants'] as const;

/** Fetch ad variants for a campaign, with optional status/preview filters and polling. */
export function useCampaignAdVariants(
  campaignId: number | undefined,
  opts?: { enabled?: boolean; status?: string; isPreview?: boolean; refetchInterval?: number | false },
) {
  return useQuery({
    queryKey: [...AD_VARIANTS_KEY, campaignId, opts?.status ?? 'any', opts?.isPreview ?? 'any'],
    queryFn: () =>
      fetchAdVariants(campaignId!, {
        status: opts?.status,
        isPreview: opts?.isPreview,
      }),
    enabled: !!campaignId && (opts?.enabled ?? true),
    refetchInterval: opts?.refetchInterval ?? false,
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

/** Approve a single ad variant. */
export function useApproveVariant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (variantId: number) => approveAdVariant(variantId),
    onSuccess: () => qc.invalidateQueries({ queryKey: AD_VARIANTS_KEY }),
  });
}

/** Revoke approval on a single ad variant. */
export function useUnapproveVariant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (variantId: number) => unapproveAdVariant(variantId),
    onSuccess: () => qc.invalidateQueries({ queryKey: AD_VARIANTS_KEY }),
  });
}

/** Mark a campaign as active (triggers agent publishing in a future milestone). */
export function useRunCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (campaignId: number) => runCampaign(campaignId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['campaigns'] }),
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
