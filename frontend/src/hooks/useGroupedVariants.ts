import { useMemo } from 'react';
import type { AdVariant } from '../types';

/** Stable key used by the bucket for variants without a persona. */
export const GENERAL_GROUP_KEY = '__general__';

/** Display name for the catch-all bucket. */
export const GENERAL_GROUP_NAME = 'General';

export interface VariantGroup {
  /** `persona_id` for real groups; `GENERAL_GROUP_KEY` for the catch-all. */
  key: string;
  /** Persona name for real groups; `GENERAL_GROUP_NAME` for the catch-all. */
  name: string;
  /** True when this is the catch-all bucket — used to render it last and style it differently. */
  isGeneral: boolean;
  variants: AdVariant[];
}

/**
 * Groups variants by `persona_id`. Real groups come first ordered by persona_id ASC
 * (stable across re-renders), with the "General" bucket always last.
 *
 * Variants with `persona_id == null` (no consumer or unassigned consumer) land in
 * the General bucket so nothing silently disappears from the UI.
 */
export function useGroupedVariants(variants: AdVariant[]): VariantGroup[] {
  return useMemo(() => {
    const buckets = new Map<string, VariantGroup>();

    for (const v of variants) {
      const key = v.persona_id ?? GENERAL_GROUP_KEY;
      const name = v.persona_name ?? GENERAL_GROUP_NAME;
      const existing = buckets.get(key);
      if (existing) {
        existing.variants.push(v);
      } else {
        buckets.set(key, {
          key,
          name,
          isGeneral: key === GENERAL_GROUP_KEY,
          variants: [v],
        });
      }
    }

    const groups = Array.from(buckets.values());
    groups.sort((a, b) => {
      if (a.isGeneral !== b.isGeneral) return a.isGeneral ? 1 : -1;
      return a.key.localeCompare(b.key);
    });
    return groups;
  }, [variants]);
}
