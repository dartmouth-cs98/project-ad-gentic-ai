# Backend HTTP reference

Base URL (local): `http://localhost:8000`  
Vite dev proxy: browser calls **`/api/...`** → backend **`/...`** (see `frontend/vite.config.ts`).

OpenAPI: **`/docs`**, **`/redoc`**.

## Root| Method | Path | Notes |
|--------|------|--------|
| GET, HEAD | `/` | Service metadata JSON |
| GET | `/health` | `{"status":"healthy"}` |

## By router prefix

### `/auth`

| Method | Path |
|--------|------|
| POST | `/auth/signup` |
| POST | `/auth/signin` |
| GET | `/auth/me` |
| POST | `/auth/onboarding` |

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

### `/personas`

| Method | Path |
|--------|------|
| GET | `/personas/` |

---

**Auth note:** Many routes use **`get_current_client_id`**; some (notably parts of **`/campaigns`**) do not—see [BACKEND.md](../BACKEND.md). Prefer verifying each handler when integrating.
