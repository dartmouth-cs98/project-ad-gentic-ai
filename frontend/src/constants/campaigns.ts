/** Canonical platform IDs for create/settings flows (list API does not expose per-campaign platforms yet). */
export interface CampaignPlatformOption {
  id: string;
  label: string;
}

export const CAMPAIGN_PLATFORM_OPTIONS: readonly CampaignPlatformOption[] = [
  { id: 'instagram', label: 'Instagram' },
  { id: 'facebook', label: 'Facebook' },
  { id: 'tiktok', label: 'TikTok' },
  { id: 'youtube', label: 'YouTube' },
  { id: 'linkedin', label: 'LinkedIn' },
  { id: 'twitter', label: 'X (Twitter)' },
  { id: 'google', label: 'Google Ads' },
];
