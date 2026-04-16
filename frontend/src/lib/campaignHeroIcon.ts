import type { CampaignHeroIcon } from '../types';

export const HERO_ICON_STYLES: Record<CampaignHeroIcon, { wrap: string; iconClass: string }> = {
  users: { wrap: 'bg-blue-100', iconClass: 'w-5 h-5 text-blue-600' },
  pointer: { wrap: 'bg-purple-100', iconClass: 'w-5 h-5 text-purple-600' },
  chart: { wrap: 'bg-emerald-100', iconClass: 'w-5 h-5 text-emerald-600' },
  globe: { wrap: 'bg-amber-100', iconClass: 'w-5 h-5 text-amber-600' },
};

const KNOWN_HERO_ICONS = new Set(Object.keys(HERO_ICON_STYLES) as CampaignHeroIcon[]);

/** API payloads are not validated at runtime; coerce unknown icon strings to a safe default. */
export function normalizeCampaignHeroIcon(icon: unknown): CampaignHeroIcon {
  return typeof icon === 'string' && KNOWN_HERO_ICONS.has(icon as CampaignHeroIcon)
    ? (icon as CampaignHeroIcon)
    : 'chart';
}

export function getHeroIconStyles(icon: unknown) {
  return HERO_ICON_STYLES[normalizeCampaignHeroIcon(icon)];
}
