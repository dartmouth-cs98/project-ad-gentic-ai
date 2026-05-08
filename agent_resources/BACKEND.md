# Backend guide

This document answers: **“How do I change backend behavior without breaking structure?”** It describes the **FastAPI** app under **`backend/`** as implemented today.

---

## Service structure (physical layout)

The backend is a **single deployable** (one `main.py`, one uvicorn process) with **modular packages**:

| Area | Responsibility |
|------|----------------|
| **`main.py`** | App factory: middleware, **router includes**, **`lifespan`** (starts background poller). |
| **`routes/`** | HTTP API: path handlers, `Depends`, map to `crud` and/or `services`. |
| **`services/`** | Domain orchestration **without** owning HTTP: chat AI, persona processing, ad job **poller**, stubs (e.g. scheduler placeholder). |
| **`crud/`** | Persistence helpers: SQLAlchemy **`Session`** in, ORM out; **commit/refresh** patterns. |
| **`models/`** | SQLAlchemy ORM (`DeclarativeBase`), `dbo` schema, table definitions. |
| **`schemas/`** | Pydantic v2 models: request bodies, responses (`model_config = {"from_attributes": True}` where needed). |
| **`workers/`** | **Pipelines** and optional **HTTP sub-routers**: `worker.py` (core logic), `service.py` (FastAPI `APIRouter` for worker endpoints). |
| **`core/`** | Shared infrastructure clients (e.g. **`get_openai_client`**). |
| **`database.py`** | Engine/session factory, **`get_db`** dependency, Azure AD vs URL auth. |
| **`dependencies.py`** | **`get_current_client_id`** (JWT bearer). |
| **`scripts/`** | One-off maintenance (seeding, vectors)—not part of request path. |
| **`tests/`** | **`pytest`**, `conftest` fixtures. |

**Naming rule of thumb:** If it **`await`**s LLMs, runs long loops, or coordinates multiple CRUD calls for one use case, put it in **`services/`** or **`workers/`**. If it is mostly **`select` / `insert` / `update`**, put it in **`crud/`**.

---

## Request lifecycle

1. **Uvicorn** dispatches to FastAPI.
2. **CORS** runs first (`ALLOWED_ORIGINS` read at import time from **`os.environ`**—must be set).
3. **Router** matches path (prefixes set in `main.py`, e.g. `/auth`, `/campaigns`, `/consumers`).
4. **Dependencies:**
   - **`get_db`**: opens a **`Session`**, **`yield`**, **`close`** in `finally`.
   - **`get_current_client_id`**: validates **`Authorization: Bearer`**, decodes JWT (`JWT_SECRET`, HS256), returns **`int`** client id or **401**.
5. Handler runs: validates with **`schemas`**, calls **`crud`** / **`services`**.
6. Response: Pydantic **`response_model`** or plain dict; **`HTTPException`** becomes JSON error with **`detail`**.

**Background work:** The **`lifespan`** context runs **`_ensure_auth_columns_exist()`** on SQL Server (best-effort DDL for `business_clients` auth columns), then starts **`run_poller()`** as an **`asyncio`** task; the poller is **not** tied to a single HTTP request.

---

## Domain / service / “repository” boundaries

| Layer | Should | Should not |
|--------|--------|------------|
| **`routes/`** | Parse HTTP, auth dependency, status codes, call one orchestration entry. | Embed SQL or multi-step business rules inline (keep thin). |
| **`services/`** | Coordinate CRUD + external APIs; reusable across routes/poller. | Duplicate CRUD that belongs in **`crud/`**. |
| **`crud/`** | Encapsulate queries and transactions for one aggregate/table family. | Call HTTP or LLM clients directly (keep side effects in services/workers). |
| **`workers/`** | End-to-end side-effect pipelines (generate script → moderate → video → blob). | Register routes here **except** via each worker’s **`service.py`** router included from `main` or mounted pattern. |
| **`schemas/`** | I/O shapes, field constraints (`Field(max_length=…)`). | Import ORM models as types for DB writes (use **`model_dump()`** at boundary). |

**Crossing boundaries:** Pass **IDs and plain dicts/dataclasses** between layers; avoid leaking **`Session`** outside `crud`/`routes`/services that are designed to manage it.

---

## DB access patterns

- **Engine:** Created lazily in **`database.py`** (`_get_engine` / `_get_session_factory`) so imports work in CI without DB.
- **SQL Server:** Models use **`schema="dbo"`**; some columns use **`UNIQUEIDENTIFIER`** for UUIDs (jobs/batches).
- **Session per request:** **`get_db`** yields one **`Session`**; routes/services should **not** share sessions across threads.
- **CRUD style:** `db.add` → `commit` → `refresh` on create; `db.get` / `select` + `scalars` for reads; **`model_dump(exclude_unset=True)`** for patches.
- **Auth-aware queries:** Prefer **`crud`** functions that take **`client_id`** (e.g. **`get_consumers(db, client_id=…)`**) and use **`filter_owned_consumer_ids`** where bulk operations must be scoped.

**Lazy engine caveat:** First DB use may fail fast with a clear error if **`DB_CONNECTION_STRING`** (or Azure AD env) is missing.

---

## Background jobs

| Mechanism | Behavior |
|-----------|----------|
| **Ad job poller** | **`services/ad_job_poller/service.py`**: infinite loop (cancellable), **`AD_JOB_POLL_INTERVAL_SECONDS`**, loads pending **`ad_jobs`**, **`claim_ad_job`**, **`await execute_ad_job`**, updates job + **`increment_ad_job_batch_progress`**. |
| **Enqueue** | **`workers/ad_job_worker/worker.py`** — **`generate_campaign_ad_variants`** creates batch + rows; HTTP **`POST .../generate-campaign-ad-variants`** triggers enqueue. |
| **Synchronous run** | **`POST /ad-job-worker/run-ad-job`** runs **`execute_ad_job`** in-process without queue (for ops/debug). |

There is **no Celery/Redis** queue in this repo: **the database is the queue**.

---

## External integrations

| Integration | Where | Config (typical) |
|-------------|--------|------------------|
| **Azure Blob** | Product images, ad videos, SAS helpers in routes | **`AZURE_STORAGE_CONNECTION_STRING`** |
| **Azure SQL / ODBC** | **`database.py`** | **`DB_CONNECTION_STRING`**, **`DB_PASSWORD`**, or **`USE_AZURE_AD`** + **`DB_ODBC_CONNECTION_STRING`** |
| **OpenAI-compatible** | Chat, moderation, video worker, script **`AsyncOpenAI`** path, shared clients | **`OPENAI_API_KEY`**, **`SCRIPT_*`**, **`VIDEO_API_KEY`** |
| **xAI SDK** | Batch script creation (`batch_generate_ad_scripts`) | **`xai_sdk`** + **`SCRIPT_*`** in **`script_creation_worker`** |
| **Meta Graph / OAuth** | Social connect, insights, publish helpers | **`META_*`**, **`FERNET_SECRET_KEY`**, `services/meta/` |
| **Resend** | Email verification and password reset | **`RESEND_*`** |
| **Google** | **`POST /auth/google`** | **`GOOGLE_CLIENT_SECRET`** |

Client singletons: **`get_openai_client`** is **`lru_cache`**’d; tests can **`cache_clear()`**.

---

## Auth / authz model

- **Authentication:** **JWT** in **`dependencies.py`**: Bearer token, **`sub`** = client id, **7-day** expiry from **`create_access_token`** (`routes/auth.py`).
- **Signup/signin:** **`passlib`** bcrypt; **`POST /auth/signup`** returns **202** and triggers email verification; **`POST /auth/google`** for Google. Password reset and email verification endpoints live under **`/auth`** (see [references/backend-api.md](./references/backend-api.md)).
- **Authorization:** **Inconsistent by module**—treat this as a **known structural gap**:
  - **Strong:** **`consumers`**, **`products`**, **`chat_*`**, **`personas`** list (JWT required; consumers/products scoped by **`client_id`**).
  - **Weak:** **`campaigns`** CRUD uses **`business_client_id` query param** on list and **no JWT** on several endpoints—**any caller who knows an id can read/update** unless network layer restricts access. **New work** should align campaigns (and similar) with **`get_current_client_id`** and **ownership checks** in **`crud`** or route.

**Pattern to move toward:** **`client_id: int = Depends(get_current_client_id)`** + **`crud`** functions that enforce **`Model.business_client_id == client_id`** on every read/write.

---

## Validation and error handling

- **Input:** **Pydantic** schemas on route bodies; FastAPI returns **422** on validation failure.
- **App errors:** Raise **`HTTPException(status_code=…, detail=…)`** with **string** or structured **`detail`** (FastAPI serializes).
- **DB integrity:** e.g. **`IntegrityError`** in **`consumers`** CSV path—catch and map to a **409** or clear message.
- **Workers/poller:** **`execute_ad_job`** catches exceptions, sets **`ad_variant`** to **`failed`** with traceback in **`meta`**, re-raises; poller marks **`ad_job`** failed and increments batch **`failed_jobs`**. Invalid **`input_json`** → job **failed** without bumping **`attempt_count`** (parse before claim).

There is **no** global exception handler in `main.py` for logging/masking—**add carefully** if you introduce one (preserve **`HTTPException`** behavior).

---

## API conventions

- **Prefixes:** Set in **`main.py`** (`/auth`, `/campaigns`, `/social-auth`, …). **OpenAPI** at **`/docs`**.
- **REST style:** **GET list/detail**, **POST create**, **PUT update**, **DELETE** with **204** where appropriate.
- **Worker routes:** Under **`/ad-job-worker`**, **`/ad-post-worker`** (hello + generation endpoints).
- **Response models:** Prefer **`response_model=…`** for stable JSON shapes.
- **Query params:** Filtering/skip/limit on list endpoints; some use **optional** `status`, **`batch_id`**, **`is_preview`** (variants).

When adding endpoints: **register router in `main.py`**, add **`tags`**, and mirror **frontend `api/*.ts`** paths (`/api` strip in Vite proxy).

---

## Migration rules

- **No Alembic (or other) migration package** is checked in under **`backend/`**. Schema is assumed to match **`models/`** (likely applied manually or via external tooling).
- **Rules until migrations exist:**
  1. **Any new column/table** → update **`models/`** + coordinate **DB change** in the shared environment (script or DBA).
  2. **Do not** change **`models/`** in ways that **drift** from production without a **deploy order** (migration first, then code, or feature flags).
  3. Prefer **nullable new columns** or **defaults** for zero-downtime rollouts.
  4. If you introduce **Alembic**, add it under **`backend/`**, document **`alembic upgrade head`** in [AGENTS.md](../AGENTS.md), and treat revisions as **required** for schema changes.

---

## Idempotency and concurrency

| Concern | Current behavior |
|---------|------------------|
| **Ad job claiming** | **`claim_ad_job`** uses **`UPDATE … WHERE locked_at IS NULL AND status = 'pending'`** and increments **`attempt_count`**—**one winner** per claim. |
| **Poller concurrency** | Multiple processes = multiple pollers; **safe** if DB supports the atomic update (SQL Server does). |
| **Retries** | **`get_pending_ad_jobs`** excludes rows with **`attempt_count >= max_attempts`** (env **`AD_JOB_MAX_ATTEMPTS`**, default **3**). |
| **Lock release** | **`release_job_lock`** can return job to **`pending`** for retry (optional **`worker_id`** check). |
| **Batch idempotency** | **`ad_job_batches.idempotency_key`** exists in schema but **`generate_campaign_ad_variants`** passes **`None`** today—**not enforced**; duplicate enqueue calls can create **duplicate batches**. |
| **Variant uniqueness** | Batch generation **skips** consumers who already have a variant for **(campaign, version)**; races could still double-create if two enqueues run **before** variants exist—mitigate with **transaction** or **unique constraint** if product requires hard guarantees. |

**Safe change checklist for jobs:** touch **`crud/ad_job.py`**, **`ad_job_poller`**, and **`workers/ad_job_worker`** together; add **`tests/test_ad_job_poller.py`** / **`test_ad_job_crud.py`** scenarios.

---

## Related docs

| Doc | Purpose |
|-----|---------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | System-wide data flow and deployment. |
| [PRODUCT.md](./PRODUCT.md) | Business behavior the backend should implement. |
| [TESTING.md](./TESTING.md) | pytest, fixtures, CI workflows. |
| [references/](./references/) | HTTP paths, env vars, tables (lookup). |
| [design-docs/](./design-docs/) | Major changes: write design here before coding. |
| [backend/README.md](../backend/README.md) | Runbook, ports, worker prefixes. |
| [AGENTS.md](../AGENTS.md) | How to run the repo and CI summary. |
