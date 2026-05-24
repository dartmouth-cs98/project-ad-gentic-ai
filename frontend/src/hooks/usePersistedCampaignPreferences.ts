import { useCallback, useEffect, useRef, useState } from 'react';
import { useQueryClient, type QueryClient } from '@tanstack/react-query';
import { patchCampaignDraftPreferences } from '../api/campaigns';
import { CAMPAIGNS_KEY } from './useCampaigns';
import type { Campaign } from '../types';
import type { FilterAction, FilterState } from './useFilterState';
import { cloneDefaultFilterState } from '../types/generationPreferences';
import {
  buildGenerationPreferencesSnapshot,
  parseGenerationPreferencesToFilterState,
  preferencesSnapshotJson,
  resolveLatestApprovedGenerationPreferences,
} from '../types/generationPreferences';

export type PreferencesSaveStatus = 'idle' | 'saving' | 'saved' | 'error';

const SAVED_INDICATOR_MS = 2000;
const AUTOSAVE_DEBOUNCE_MS = 500;

function resolveHydrationFilterState(campaign: Campaign | undefined): FilterState {
  if (!campaign) return cloneDefaultFilterState();

  if (campaign.draft_generation_preferences) {
    return parseGenerationPreferencesToFilterState(campaign.draft_generation_preferences);
  }

  const approvedPrefs = resolveLatestApprovedGenerationPreferences(campaign.brief);
  if (approvedPrefs) {
    return parseGenerationPreferencesToFilterState(approvedPrefs);
  }

  return cloneDefaultFilterState();
}

function syncCampaignDraftToCache(
  queryClient: QueryClient,
  campaignId: number,
  updatedCampaign: Campaign,
) {
  queryClient.setQueriesData<Campaign[]>(
    { queryKey: CAMPAIGNS_KEY },
    (old) => {
      if (!Array.isArray(old)) return old;
      return old.map((c) =>
        c.id === campaignId
          ? {
              ...c,
              draft_generation_preferences: updatedCampaign.draft_generation_preferences,
            }
          : c,
      );
    },
  );
  queryClient.setQueryData([...CAMPAIGNS_KEY, campaignId], updatedCampaign);
  void queryClient.invalidateQueries({ queryKey: CAMPAIGNS_KEY });
}

/** Hydrate filter state from server; debounced autosave when preferences change. */
export function usePersistedCampaignPreferences(
  activeCampaignId: number | undefined,
  activeCampaign: Campaign | undefined,
  filterState: FilterState,
  filterDispatch: React.Dispatch<FilterAction>,
) {
  const queryClient = useQueryClient();
  const savedFadeTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const hydratedCampaignIdRef = useRef<number | undefined>(undefined);
  const prevCampaignIdRef = useRef<number | undefined>(undefined);
  const activeCampaignIdRef = useRef(activeCampaignId);
  const saveGenerationByCampaignRef = useRef(new Map<number, number>());
  const skipAutosaveOnceRef = useRef(false);
  const pendingAutosaveRef = useRef<{ campaignId: number; state: FilterState } | null>(null);
  const [saveStatus, setSaveStatus] = useState<PreferencesSaveStatus>('idle');
  const [preferencesReady, setPreferencesReady] = useState(false);
  const [lastSavedSnapshot, setLastSavedSnapshot] = useState<string | null>(null);

  activeCampaignIdRef.current = activeCampaignId;

  const persistPreferences = useCallback(
    async (campaignId: number, state: FilterState) => {
      const generation =
        (saveGenerationByCampaignRef.current.get(campaignId) ?? 0) + 1;
      saveGenerationByCampaignRef.current.set(campaignId, generation);
      const snapshotJson = preferencesSnapshotJson(state);

      if (activeCampaignIdRef.current === campaignId) {
        setSaveStatus('saving');
      }

      try {
        const updatedCampaign = await patchCampaignDraftPreferences(
          campaignId,
          buildGenerationPreferencesSnapshot(state),
        );

        // Only apply if no newer save superseded this one for the same campaign.
        if (saveGenerationByCampaignRef.current.get(campaignId) !== generation) return;

        syncCampaignDraftToCache(queryClient, campaignId, updatedCampaign);

        if (activeCampaignIdRef.current === campaignId) {
          setLastSavedSnapshot(snapshotJson);
          setSaveStatus('saved');
          if (savedFadeTimerRef.current) clearTimeout(savedFadeTimerRef.current);
          savedFadeTimerRef.current = setTimeout(() => setSaveStatus('idle'), SAVED_INDICATOR_MS);
        }
      } catch {
        if (saveGenerationByCampaignRef.current.get(campaignId) !== generation) return;
        if (activeCampaignIdRef.current === campaignId) {
          setSaveStatus('error');
        }
      }
    },
    [queryClient],
  );

  // Hydrate when switching campaigns (wait until campaign row is available).
  useEffect(() => {
    if (prevCampaignIdRef.current !== activeCampaignId) {
      hydratedCampaignIdRef.current = undefined;
      prevCampaignIdRef.current = activeCampaignId;
      skipAutosaveOnceRef.current = true;
      setPreferencesReady(false);
      setLastSavedSnapshot(null);
    }

    if (!activeCampaignId) {
      hydratedCampaignIdRef.current = undefined;
      setLastSavedSnapshot(null);
      setPreferencesReady(false);
      setSaveStatus('idle');
      return;
    }

    if (!activeCampaign || activeCampaign.id !== activeCampaignId) return;
    if (hydratedCampaignIdRef.current === activeCampaignId) return;

    hydratedCampaignIdRef.current = activeCampaignId;

    const nextState = resolveHydrationFilterState(activeCampaign);
    filterDispatch({ type: 'LOAD', payload: nextState });
    const snapshotJson = preferencesSnapshotJson(nextState);
    setLastSavedSnapshot(snapshotJson);
    setPreferencesReady(true);
    setSaveStatus('idle');
  }, [activeCampaignId, activeCampaign, filterDispatch]);

  // Debounced autosave when filter state diverges from last saved snapshot.
  useEffect(() => {
    if (!activeCampaignId || !preferencesReady) {
      pendingAutosaveRef.current = null;
      return;
    }

    if (hydratedCampaignIdRef.current !== activeCampaignId) {
      pendingAutosaveRef.current = null;
      return;
    }

    if (skipAutosaveOnceRef.current) {
      skipAutosaveOnceRef.current = false;
      pendingAutosaveRef.current = null;
      return;
    }

    const snapshotJson = preferencesSnapshotJson(filterState);
    if (snapshotJson === lastSavedSnapshot) {
      pendingAutosaveRef.current = null;
      return;
    }

    const campaignIdToSave = activeCampaignId;
    const stateToSave = filterState;
    pendingAutosaveRef.current = { campaignId: campaignIdToSave, state: stateToSave };

    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    autosaveTimerRef.current = setTimeout(() => {
      pendingAutosaveRef.current = null;
      if (hydratedCampaignIdRef.current !== campaignIdToSave) return;
      void persistPreferences(campaignIdToSave, stateToSave);
    }, AUTOSAVE_DEBOUNCE_MS);

    return () => {
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    };
  }, [activeCampaignId, filterState, preferencesReady, lastSavedSnapshot, persistPreferences]);

  // Flush pending autosave when switching campaigns or unmounting.
  useEffect(() => {
    return () => {
      const pending = pendingAutosaveRef.current;
      if (pending) {
        pendingAutosaveRef.current = null;
        void persistPreferences(pending.campaignId, pending.state);
      }
    };
  }, [activeCampaignId, persistPreferences]);

  useEffect(() => {
    return () => {
      if (savedFadeTimerRef.current) clearTimeout(savedFadeTimerRef.current);
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    };
  }, []);

  return { saveStatus };
}
