# Draft generation preferences (server-backed)

**Status:** Implemented  
**Exec plan:** [`exec-plans/2026-05-24-persist-campaign-generation-preferences.md`](../../exec-plans/2026-05-24-persist-campaign-generation-preferences.md)

## Context

Ad Studio filter panel choices (tone, platforms, variants per group, etc.) were in-memory only on Generate Ads. Users lost edits on refresh and could not sync prefs across devices.

## Goals

- Persist **draft** panel state per campaign on the server.
- Hydrate panel when switching campaigns or opening on another device.
- Keep **approved version** snapshots in `campaign.brief[version].generation_preferences` unchanged at plan approve.

## Non-goals

- Auto-regenerate variants when prefs change in results phase.
- Optimistic concurrency / merge UI (v1: last-write-wins).
- JWT hardening for unauthenticated `PUT /campaigns/{id}` (follow-up).

## Design

| Layer | Choice |
|-------|--------|
| Storage | `campaigns.draft_generation_preferences` (nullable JSON text) |
| Write (editing) | `PATCH /campaigns/{id}/draft-generation-preferences` — JWT + ownership |
| Write (approve) | `PUT /campaigns/{id}` with `brief` + `draft_generation_preferences` |
| Frontend | `usePersistedCampaignPreferences` — hydrate on campaign switch; 500 ms debounced autosave |

**Hydration order:** server draft → latest approved `generation_preferences` in `brief` → UI defaults.

**Autosave guards:** skip one debounce cycle after campaign switch (avoids writing previous campaign’s prefs to the new id); only save when `hydratedCampaignIdRef` matches active campaign; ignore stale PATCH responses via save generation counter.

## Rollout

1. Backend migration (`main.py` startup helper on SQL Server).
2. Frontend reads/writes new column; old clients ignore the field.

## Testing

- Backend: `backend/tests/test_campaign_draft_preferences.py`
- Frontend: `frontend/src/types/generationPreferences.test.ts`

## Implementation notes

- Apply button removed in favor of debounced autosave.
- `PreferencesSaveIndicator` shows Saving / Saved / error in filter panel and results toolbar.
- Known follow-up: authenticate `PUT /campaigns/{id}`.
