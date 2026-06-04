# Generation preferences (canonical shape)

Structured snapshot of the **Ad Studio** filter panel at **plan approval**, persisted inside `campaign.brief` JSON per creative version.

## Storage

### Draft (in-progress panel)

- Column: `campaigns.draft_generation_preferences` (nullable JSON text).
- Written via **debounced autosave** (500 ms) when the user edits the preferences panel (`PATCH /campaigns/{id}/draft-generation-preferences`) and on plan approve via **`PUT /campaigns/{id}`** (same snapshot as the approved version).
- Hydration order on Generate Ads: server draft → else latest approved version’s `generation_preferences` in `brief` → else UI defaults.

### Approved version (frozen at plan approve)

- Key: version number as string (`"1"`, `"2"`, …) inside `campaign.brief` JSON.
- Value (new): object with:
  - `plan_message` (string) — full assistant plan message (Markdown + JSON block).
  - `generation_preferences` (object, optional) — fields below.

Legacy values remain a **plain string** per version (plan text only); script generation uses brief + campaign fields only.

## JSON fields (`generation_preferences`)

Snake_case in JSON; TypeScript mirror: `frontend/src/types/generationPreferences.ts`. Pydantic: `backend/schemas/generation_preferences.py`.

| Field | Type | Meaning |
|-------|------|---------|
| `personalization_range` | string | `individual` \| `group` \| `broad` |
| `variants_per_group` | number | Caps **preview** variants per plan persona group (1–10); also stored for batch UX consistency |
| `ad_formats` | string[] | e.g. `images`, `videos` |
| `tone` | string | formal, playful, bold, minimal |
| `budget_tier` | string | low, mid, premium |
| `cta_style` | string | soft, direct, urgency |
| `language` | string | e.g. English (US) |
| `platforms` | string[] | placement labels |
| `color_mode` | string | brand, custom |
| `custom_color` | string (optional) | Hex when `color_mode === custom` |

**Preview:** resolved with the approved plan JSON (`utils/plan_execution.py`) and applied in `generate_campaign_preview`. If **`persona_groups`** are present but resolve to **zero** variants (name mismatch, no consumers, etc.), the API returns **no** previews — there is **no** random fallback to unrelated personas.

**Script pipeline:** `resolve_brief_and_preferences_for_version` → `generate_ad_script` appends a deterministic **User-approved generation preferences** block to the prompt (`workers/script_creation_worker/worker.py`).
