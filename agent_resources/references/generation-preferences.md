# Generation preferences (canonical shape)

Structured snapshot of the **Ad Studio** filter panel at **plan approval**, persisted inside `campaign.brief` JSON per creative version.

## Storage

- Key: version number as string (`"1"`, `"2"`, …).
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

**Preview:** resolved with the approved plan JSON (`utils/plan_execution.py`) and applied in `generate_campaign_preview`.

**Script pipeline:** `resolve_brief_and_preferences_for_version` → `generate_ad_script` appends a deterministic **User-approved generation preferences** block to the prompt (`workers/script_creation_worker/worker.py`).
