# Database Schema Summary

Authoritative **SQL Server** shape for `dbo.*` tables (columns and FKs). SQLAlchemy models live in **`backend/models/`**; see [references/persistence.md](./references/persistence.md) for ORM mapping notes (e.g. `ad_variants.metadata` → model field `meta`, optional `session_id` mapped in ORM but not on API schemas).

When this file and code disagree, verify the live database, then update **both** SCHEMA and models.

## Tables

### ad_job_batches
| Column | Type | Nullable | Key | References |
|---|---|---|---|---|
| id | uniqueidentifier | no | PK |  |
| user_id | uniqueidentifier | no |  |  |
| status | nvarchar(40) | no |  |  |
| total_jobs | int | no |  |  |
| succeeded_jobs | int | no |  |  |
| failed_jobs | int | no |  |  |
| idempotency_key | nvarchar(510) | yes |  |  |
| created_at | datetime2 | no |  |  |
| updated_at | datetime2 | no |  |  |
| canceled_at | datetime2 | yes |  |  |

### ad_jobs
| Column | Type | Nullable | Key | References |
|---|---|---|---|---|
| id | uniqueidentifier | no | PK |  |
| batch_id | uniqueidentifier | no | FK | ad_job_batches.id |
| status | nvarchar(40) | no |  |  |
| input_json | nvarchar(MAX) | no |  |  |
| output_json | nvarchar(MAX) | yes |  |  |
| error_message | nvarchar(MAX) | yes |  |  |
| attempt_count | int | no |  |  |
| locked_at | datetime2 | yes |  |  |
| locked_by | nvarchar(200) | yes |  |  |
| created_at | datetime2 | no |  |  |
| updated_at | datetime2 | no |  |  |

### ad_variants
| Column | Type | Nullable | Key | References |
|---|---|---|---|---|
| id | int | no | PK |  |
| session_id | int | yes |  |  |
| campaign_id | int | no | FK | campaigns.id |
| consumer_id | int | yes | FK | consumers.id |
| status | nvarchar(100) | no |  |  |
| media_url | nvarchar(1000) | yes |  |  |
| metadata | nvarchar(MAX) | yes |  |  |
| created_at | datetime2 | no |  |  |
| updated_at | datetime2 | no |  |  |
| published_at | datetime2 | yes |  |  |
| version_number | int | no |  |  |
| product_id | int | yes | FK | products.id |
| is_preview | bit | no |  |  |
| is_approved | bit | no |  |  |

### business_clients
| Column | Type | Nullable | Key | References |
|---|---|---|---|---|
| id | int | no | PK |  |
| email | nvarchar(510) | no |  |  |
| password_hash | nvarchar(510) | yes |  |  |
| business_name | nvarchar(510) | no |  |  |
| subscription_tier | nvarchar(100) | no |  |  |
| stripe_customer_id | nvarchar(510) | yes |  |  |
| credits_balance | int | no |  |  |
| credits_daily_reset_on | date | no |  |  |
| created_at | datetime2 | no |  |  |
| traits | nvarchar(MAX) | yes |  |  |
| email_verified | bit | no |  |  |
| email_verification_token_hash | nvarchar(510) | yes |  |  |
| email_verification_expires_at | datetime2 | yes |  |  |
| password_reset_token_hash | nvarchar(510) | yes |  |  |
| password_reset_expires_at | datetime2 | yes |  |  |
| auth_provider | varchar(50) | yes |  |  |

### campaign_metrics
| Column | Type | Nullable | Key | References |
|---|---|---|---|---|
| id | int | no | PK |  |
| campaign_id | int | no | FK | campaigns.id |
| meta_campaign_id | nvarchar(200) | yes |  |  |
| date | date | no |  |  |
| impressions | int | yes |  |  |
| reach | int | yes |  |  |
| clicks | int | yes |  |  |
| spend | decimal | yes |  |  |
| ctr | decimal | yes |  |  |
| cpc | decimal | yes |  |  |
| conversions | int | yes |  |  |
| fetched_at | datetime2 | no |  |  |
| external_campaign_id | varchar(100) | yes |  |  |
| external_platform | varchar(32) | yes |  |  |

### campaigns
| Column | Type | Nullable | Key | References |
|---|---|---|---|---|
| id | int | no | PK |  |
| business_client_id | int | no | FK | business_clients.id |
| name | nvarchar(510) | no |  |  |
| status | nvarchar(100) | no |  |  |
| budget_total | decimal | yes |  |  |
| start_date | date | yes |  |  |
| end_date | date | yes |  |  |
| goal | nvarchar(100) | yes |  |  |
| target_audience | nvarchar(MAX) | yes |  |  |
| product_context | nvarchar(MAX) | yes |  |  |
| created_at | datetime2 | no |  |  |
| updated_at | datetime2 | no |  |  |
| product_ids | nvarchar(MAX) | yes |  |  |
| brief | nvarchar(MAX) | yes |  |  |
| meta_campaign_id | nvarchar(200) | yes |  |  |
| platforms | nvarchar(MAX) | yes |  |  |
| external_campaign_id | varchar(100) | yes |  |  |
| external_platform | varchar(32) | yes |  |  |

### chat_messages
| Column | Type | Nullable | Key | References |
|---|---|---|---|---|
| id | int | no | PK |  |
| campaign_id | int | no | FK | campaigns.id |
| business_client_id | int | no | FK | business_clients.id |
| role | nvarchar(40) | no |  |  |
| message_type | nvarchar(60) | no |  |  |
| content | nvarchar(MAX) | no |  |  |
| version_ref | int | yes |  |  |
| timestamp | datetime2 | no |  |  |

### consumer_events
| Column | Type | Nullable | Key | References |
|---|---|---|---|---|
| id | bigint | no | PK |  |
| ad_variant_id | int | no | FK | ad_variants.id |
| event_type | nvarchar(100) | no |  |  |
| consumer_fingerprint | nvarchar(510) | yes |  |  |
| timestamp | datetime2 | no |  |  |
| platform | nvarchar(100) | yes |  |  |
| session_id | nvarchar(510) | yes |  |  |
| user_agent | nvarchar(1000) | yes |  |  |
| referrer | nvarchar(2000) | yes |  |  |
| metadata | nvarchar(MAX) | yes |  |  |

### consumers
| Column | Type | Nullable | Key | References |
|---|---|---|---|---|
| id | int | no | PK |  |
| email | nvarchar(510) | yes |  |  |
| phone | nvarchar(100) | yes |  |  |
| first_name | nvarchar(200) | no |  |  |
| last_name | nvarchar(200) | no |  |  |
| traits | nvarchar(MAX) | yes |  |  |
| created_at | datetime2 | no |  |  |
| updated_at | datetime2 | no |  |  |
| business_client_id | int | no | FK | business_clients.id |
| primary_persona_id | uniqueidentifier | yes | FK | personas.id |
| secondary_persona_id | uniqueidentifier | yes | FK | personas.id |
| persona_confidence | decimal | yes |  |  |
| persona_assigned_at | datetime2 | yes |  |  |
| consumer_traits_description | nvarchar(MAX) | yes |  |  |

### personas
| Column | Type | Nullable | Key | References |
|---|---|---|---|---|
| id | uniqueidentifier | no | PK |  |
| name | nvarchar(100) | no |  |  |
| description | nvarchar(MAX) | no |  |  |
| key_motivators | nvarchar(MAX) | no |  |  |
| pain_points | nvarchar(MAX) | no |  |  |
| ad_tone_preferences | nvarchar(MAX) | yes |  |  |
| created_at | datetime2 | yes |  |  |
| feature_vector | nvarchar(MAX) | yes |  |  |

### products
| Column | Type | Nullable | Key | References |
|---|---|---|---|---|
| id | int | no | PK |  |
| business_client_id | int | no | FK | business_clients.id |
| name | nvarchar(510) | no |  |  |
| description | nvarchar(MAX) | yes |  |  |
| image_url | nvarchar(1000) | yes |  |  |
| product_link | nvarchar(1000) | yes |  |  |
| product_metadata | nvarchar(MAX) | yes |  |  |
| is_active | bit | yes |  |  |
| created_at | datetime2 | yes |  |  |
| updated_at | datetime2 | yes |  |  |
| image_name | nvarchar(510) | yes |  |  |

### social_connections
| Column | Type | Nullable | Key | References |
|---|---|---|---|---|
| id | int | no | PK |  |
| business_client_id | int | no | FK | business_clients.id |
| platform | nvarchar(60) | no |  |  |
| encrypted_token | nvarchar(MAX) | no |  |  |
| token_expires_at | datetime2 | yes |  |  |
| platform_account_id | nvarchar(200) | yes |  |  |
| platform_metadata | nvarchar(MAX) | yes |  |  |
| connected_at | datetime2 | no |  |  |

## Relationships

- `ad_jobs.batch_id` → `ad_job_batches.id`
- `ad_variants.campaign_id` → `campaigns.id`
- `ad_variants.consumer_id` → `consumers.id`
- `ad_variants.product_id` → `products.id`
- `campaign_metrics.campaign_id` → `campaigns.id`
- `campaigns.business_client_id` → `business_clients.id`
- `chat_messages.business_client_id` → `business_clients.id`
- `chat_messages.campaign_id` → `campaigns.id`
- `consumer_events.ad_variant_id` → `ad_variants.id`
- `consumers.business_client_id` → `business_clients.id`
- `consumers.primary_persona_id` → `personas.id`
- `consumers.secondary_persona_id` → `personas.id`
- `products.business_client_id` → `business_clients.id`
- `social_connections.business_client_id` → `business_clients.id`

## Application delete (campaigns)

There are **no `ON DELETE CASCADE`** FKs in SQL Server for campaign children. **`DELETE /campaigns/{id}`** and **`POST /campaigns/bulk-delete`** delete in this order (see `backend/crud/campaign.py`):

1. `consumer_events` (via `ad_variants` on the campaign)
2. `ad_variants`
3. `campaign_metrics`
4. `chat_messages` (`campaign_id` only)
5. `campaigns`

`ad_jobs` are not FK-linked to `campaigns`. Blob objects for variant videos are not removed on delete.
