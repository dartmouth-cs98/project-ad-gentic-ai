# Backend HTTP reference

Base URL (local): `http://localhost:8000`  
Vite dev proxy: browser calls **`/api/...`** → backend **`/...`** (see `frontend/vite.config.ts`).

OpenAPI: **`/docs`**, **`/redoc`**.

## Root and health

| Method | Path | Notes |
|--------|------|--------|
| GET, HEAD | `/` | Service metadata JSON |
| GET | `/health` | `{"status":"healthy"}` |

## By router prefix

### `/auth`

| Method | Path |
|--------|------|
| POST | `/auth/signup` |
| POST | `/auth/signin` |
| POST | `/auth/verify-email` |
| POST | `/auth/resend-verification` |
| POST | `/auth/request-password-reset` |
| POST | `/auth/reset-password` |
| POST | `/auth/google` |
| GET | `/auth/me` |
| POST | `/auth/onboarding` |

### `/social-auth`

JWT required except **`GET /social-auth/callback`** (browser redirect from Meta).

| Method | Path |
|--------|------|
| GET | `/social-auth/connect` |
| GET | `/social-auth/callback` |
| GET | `/social-auth/status` |
| DELETE | `/social-auth/disconnect` |

### `/ad-generation` (JWT — daily credits)

| Method | Path |
|--------|------|
| POST | `/ad-generation/generate-campaign-preview` |
| POST | `/ad-generation/generate-campaign-ad-variants` |

Requires auth; enforces campaign/product ownership and daily credit balance. Returns **402** when insufficient credits.

### `/ad-job-worker`

| Method | Path |
|--------|------|
| GET | `/ad-job-worker/hello` |
| POST | `/ad-job-worker/run-ad-job` |
| POST | `/ad-job-worker/generate-campaign-preview` (deprecated — **410**; use `/ad-generation`) |
| POST | `/ad-job-worker/generate-campaign-ad-variants` (deprecated — **410**; use `/ad-generation`) |

### `/ad-post-worker`

| Method | Path |
|--------|------|
| GET | `/ad-post-worker/hello` |

### `/ad-variants`

| Method | Path |
|--------|------|
| GET | `/ad-variants/` |
| GET | `/ad-variants/{ad_variant_id}` |
| POST | `/ad-variants/` |
| PUT | `/ad-variants/{ad_variant_id}` |
| DELETE | `/ad-variants/{ad_variant_id}` |
| PATCH | `/ad-variants/{ad_variant_id}/approve` |
| PATCH | `/ad-variants/{ad_variant_id}/unapprove` |

### `/ad-jobs`

| Method | Path |
|--------|------|
| GET | `/ad-jobs/` |
| GET | `/ad-jobs/{ad_job_id}` |
| POST | `/ad-jobs/` |
| PUT | `/ad-jobs/{ad_job_id}` |
| DELETE | `/ad-jobs/{ad_job_id}` |

### `/ad-job-batches`

| Method | Path |
|--------|------|
| GET | `/ad-job-batches/` |
| GET | `/ad-job-batches/{batch_id}` |
| POST | `/ad-job-batches/` |
| PUT | `/ad-job-batches/{batch_id}` |
| DELETE | `/ad-job-batches/{batch_id}` |

### `/campaigns`

| Method | Path |
|--------|------|
| GET | `/campaigns/` |
| GET | `/campaigns/{campaign_id}` |
| POST | `/campaigns/` |
| PUT | `/campaigns/{campaign_id}` |
| DELETE | `/campaigns/{campaign_id}` |
| POST | `/campaigns/bulk-delete` |
| PATCH | `/campaigns/{campaign_id}/run` |
| PATCH | `/campaigns/{campaign_id}/draft-generation-preferences` |

**`PATCH /campaigns/{id}/draft-generation-preferences`:** Requires JWT; caller must own the campaign. Body = `GenerationPreferences` JSON (same shape as version snapshots in `brief`). Persists in-progress Ad Studio panel state to `campaigns.draft_generation_preferences` for cross-device sync. **200** returns `CampaignResponse` with parsed `draft_generation_preferences`. **401** / **403** / **404** / **422** as usual.

**`PUT /campaigns/{id}`** may also include `draft_generation_preferences` (object or JSON string) alongside other fields — used on plan approve together with `brief`.

**`DELETE /campaigns/{id}`:** Requires JWT (`Authorization: Bearer`). Caller must own `campaign.business_client_id` (**403** otherwise). Cascade-deletes `consumer_events` (via variants), `ad_variants`, `campaign_metrics`, `campaign_publications`, and `chat_messages`, then the campaign (**204**). **401** without valid token; **404** if missing; **409** if a FK still blocks delete after cascade (`CampaignDeleteConflict`).

**`PATCH /campaigns/{id}/run`:** Requires JWT; caller must own the campaign. Publishes **approved** ad variants to Meta (Instagram connection required), groups ads by consumer primary persona, upserts **`campaign_publications`** for platform `meta`, sets campaign **`status`** to **`active`**, and syncs legacy **`meta_campaign_id`**. Idempotent when already **`active`**. **400** if no approved variants or connection invalid; **502** on Meta API failure (partial state may be saved for retry).

**`POST /campaigns/bulk-delete`:** Requires JWT. If any **existing** id in the request belongs to another client, the whole request fails with **403** (no partial delete). Request body:

```json
{ "campaign_ids": [1, 2, 3] }
```

- **1–50** unique ids (deduped server-side; order preserved for `not_found_ids`).
- One transaction per request (same cascade order as single delete); avoids parallel-delete deadlocks on SQL Server.
- **200** response:

```json
{ "deleted_ids": [1, 2], "not_found_ids": [3] }
```

Deletes all **found** ids; ids with no row are listed in `not_found_ids` (no error if some missing).

- **401** — missing or invalid Bearer token.
- **403** — at least one requested id exists but belongs to another `business_client_id`.
- **409** — FK still blocks after cascade.
- **422** — empty list or more than 50 ids.

Frontend: campaigns list uses bulk when **2+** selected; single id uses **`DELETE /campaigns/{id}`** ([`deleteCampaignsBulk`](../frontend/src/api/campaigns.ts)).

**Campaign metrics** (separate router file; same URL prefix **`/campaigns`** — registered after core campaign routes in `main.py`):

| Method | Path |
|--------|------|
| GET | `/campaigns/{campaign_id}/metrics` |

Requires JWT; returns cached Meta insights (may refresh if stale and social account connected).

### `/chat-messages`

| Method | Path |
|--------|------|
| GET | `/chat-messages/` |
| POST | `/chat-messages/` |
| DELETE | `/chat-messages/` |

### `/chat/completions`

| Method | Path |
|--------|------|
| POST | `/chat/completions/` |

### `/consumers`

| Method | Path |
|--------|------|
| GET | `/consumers/` |
| POST | `/consumers/upload-csv` |
| POST | `/consumers/assign-personas` |
| POST | `/consumers/` |

### `/products`

| Method | Path |
|--------|------|
| GET | `/products/` |
| GET | `/products/{product_id}` |
| POST | `/products/` |
| PUT | `/products/{product_id}` |
| DELETE | `/products/{product_id}` |
| POST | `/products/{product_id}/upload-image` |
| DELETE | `/products/{product_id}/images/{blob_name}` |

### `/personas`

| Method | Path |
|--------|------|
| GET | `/personas/` |

---

**Auth note:** Many routes use **`get_current_client_id`**; some (notably parts of **`/campaigns`** CRUD) still use **`business_client_id` query params** instead of JWT—see [BACKEND.md](../BACKEND.md). **`/campaigns/{id}/metrics`** and **`/social-auth/*`** (except **`GET /callback`**) require JWT.
