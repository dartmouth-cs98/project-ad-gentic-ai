# Persistence reference (SQLAlchemy)

ORM models live in **`backend/models/`**. Tables use schema **`dbo`** (SQL Server); tests may strip schema for SQLite.

| Module | Table (`dbo`) | Primary identifiers | Notes |
|--------|---------------|---------------------|--------|
| `business_client.py` | `business_clients` | `id` int | Email unique; `stripe_customer_id` placeholder default |
| `campaign.py` | `campaigns` | `id` int | `business_client_id`; `brief` may store versioned JSON text |
| `product.py` | `products` | `id` int | `business_client_id`; `image_name` / blob for generation |
| `consumer.py` | `consumers` | `id` int | `business_client_id`; FK to `personas`; unique `(business_client_id, email)`; `traits` JSON text; **`consumer_traits_description`** narrative for script LLM (kept in sync when traits change) |
| `persona.py` | `personas` | `id` string UUID | Unique `name`; JSON string columns for lists |
| `ad_variant.py` | `ad_variants` | `id` int | `campaign_id`, `consumer_id`, `version_number`, `is_preview`, `status`, `media_url`, `metadata` column mapped as `meta` |
| `ad_job.py` | `ad_jobs` | `id` UUID | `batch_id` UUID; lock columns; `input_json` / `output_json` |
| `ad_job_batch.py` | `ad_job_batches` | `id` UUID | Progress counters; optional `idempotency_key` |
| `chat_message.py` | `chat_messages` | `id` int | `campaign_id`, `business_client_id`, `role`, `message_type`, `content`, `version_ref` |
| `consumer_event.py` | `consumer_events` | `id` bigint | Tied to `ad_variant_id`, `event_type`, optional fingerprint/session metadata |

**Session access:** `database.get_db` → SQLAlchemy `Session`.

**CRUD:** `backend/crud/*` per aggregate.

For concurrency on jobs, see **`crud/ad_job.py`** (`claim_ad_job`, `release_job_lock`).
