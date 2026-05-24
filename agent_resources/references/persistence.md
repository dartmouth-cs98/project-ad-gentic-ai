# Persistence reference (SQLAlchemy)

ORM models live in **`backend/models/`**. Tables use schema **`dbo`** (SQL Server); tests may strip schema for SQLite.

**Column-level FK reference:** [SCHEMA.md](../SCHEMA.md) (SQL Server). This file summarizes ORM modules and behavioral notes.

| Module | Table (`dbo`) | Primary identifiers | Notes |
|--------|---------------|---------------------|--------|
| `business_client.py` | `business_clients` | `id` int | Email unique; `stripe_customer_id` placeholder default; `credits_balance` + `credits_daily_reset_on` (daily allowance) |
| `campaign.py` | `campaigns` | `id` int | `business_client_id`; `brief` may store versioned JSON text; optional `meta_campaign_id` (legacy; kept in sync with Meta publish) |
| `campaign_publication.py` | `campaign_publications` | `id` int | One row per `(campaign_id, external_platform)`; stores platform campaign id, status, partial-failure `error_message` |
| `product.py` | `products` | `id` int | `business_client_id`; `image_name` / blob for generation |
| `consumer.py` | `consumers` | `id` int | `business_client_id`; FK to `personas`; unique `(business_client_id, email)`; `traits` JSON text; **`consumer_traits_description`** narrative for script LLM (refreshed on consumer create/CSV and `seed_consumer_traits.py` — not automatic for other traits writes) |
| `persona.py` | `personas` | `id` string UUID | Unique `name`; JSON string columns for lists |
| `ad_variant.py` | `ad_variants` | `id` int | `campaign_id`, `consumer_id`, `version_number`, `is_preview`, `is_approved`, `status`, `media_url`, `metadata` column mapped as `meta`; optional `session_id` (int, no FK, ORM-only — not exposed on API schemas) |
| `ad_job.py` | `ad_jobs` | `id` UUID | `batch_id` UUID; lock columns; `input_json` / `output_json` |
| `ad_job_batch.py` | `ad_job_batches` | `id` UUID | Progress counters; optional `idempotency_key` |
| `chat_message.py` | `chat_messages` | `id` int | `campaign_id`, `business_client_id`, `role`, `message_type`, `content`, `version_ref` |
| `consumer_event.py` | `consumer_events` | `id` bigint | Tied to `ad_variant_id`, `event_type`, optional fingerprint/session metadata |
| `social_connection.py` | `social_connections` | `id` int | `business_client_id`, `platform`, encrypted token; `platform_metadata` JSON for ad account / page ids |
| `campaign_metric.py` | `campaign_metrics` | `id` int | Daily/cached Meta insights per `campaign_id` (`impressions`, `reach`, `clicks`, `spend`, `fetched_at`) |

**Session access:** `database.get_db` → SQLAlchemy `Session`.

**CRUD:** `backend/crud/*` per aggregate.

For concurrency on jobs, see **`crud/ad_job.py`** (`claim_ad_job`, `release_job_lock`).

### Campaign delete (cascade)

Implemented in **`backend/crud/campaign.py`**:

| Function | Use |
|----------|-----|
| `_cascade_delete_campaign_ids(db, ids)` | Bulk `DELETE` children + campaigns (no commit) |
| `_commit_cascade_delete(db, ids)` | Cascade + `commit`; retries SQL Server deadlock **1205** up to 3× |
| `delete_campaign(db, id)` | Single id; returns `False` if missing |
| `delete_campaigns_bulk(db, ids)` | Returns `(deleted_ids, not_found_ids)` |

**Cascade order** (per [SCHEMA.md](../SCHEMA.md)):

1. `consumer_events` — `ad_variant_id IN (variants for campaign ids)`
2. `ad_variants` — `campaign_id IN (...)`
3. `campaign_metrics` — `campaign_id IN (...)`
4. `campaign_publications` — `campaign_id IN (...)`
5. `chat_messages` — `campaign_id IN (...)` only (not filtered by `business_client_id`)
6. `campaigns` — `id IN (...)`

**Routes:** `DELETE /campaigns/{id}` → `delete_campaign`; `POST /campaigns/bulk-delete` → `delete_campaigns_bulk`.

**Errors:** `CampaignDeleteConflict` (`IntegrityError` after cascade) → HTTP **409**.

**Not deleted:** `ad_jobs` / `ad_job_batches` (no FK to `campaigns`; `campaign_id` only in `input_json`). Azure blobs for variant videos are not removed.
