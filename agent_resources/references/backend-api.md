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

### `/ad-job-worker`

| Method | Path |
|--------|------|
| GET | `/ad-job-worker/hello` |
| POST | `/ad-job-worker/run-ad-job` |
| POST | `/ad-job-worker/generate-campaign-preview` |
| POST | `/ad-job-worker/generate-campaign-ad-variants` |

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
| PATCH | `/campaigns/{campaign_id}/run` |

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
