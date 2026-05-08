# Product intent

This document answers: **“What behavior is the code trying to implement?”** It is derived from models, routes, and worker logic in `backend/` (and the product description in the root [README](../README.md)). When this file disagrees with code, **the code wins** until the product spec is updated.

---

## Target users

| Actor | Role in the system |
|--------|---------------------|
| **Business client** | Primary user: a business operator who signs up (`/auth/signup`), signs in, completes onboarding, and owns **campaigns**, **products**, and (indirectly) the ads produced for their audience. Represented by `business_clients` (email, business name, subscription tier, credits balance, optional Stripe placeholder). |
| **End consumers (audience)** | People the business markets to. Stored as **`consumers`** with traits (JSON), optional persona assignment, and contact fields. They are **not** app logins here—they are **targets** for personalized ad variants. |
| **Operators / admins** | Implied for moderation, monitoring, and infra; no separate admin product surface is spelled out in the models—**in-app “admin” is out of scope** unless the frontend adds it. |

---

## Core user journeys

1. **Onboard and authenticate** — Register or sign in, receive a JWT, load profile (`/auth/me`), persist onboarding data (business traits / plan context as implemented in auth routes).
2. **Define catalog and strategy** — Create **products** (with image in blob storage), **campaigns** (goals, audience, brief, dates, budget, linked product IDs), and maintain **personas** (marketing archetypes with motivators, pain points, tone).
3. **Build audience data** — Create or import **consumers** (per `business_client_id`), optionally run **persona assignment** (LLM-assisted mapping to primary/secondary persona + confidence).
4. **Explore creative (preview)** — Call **campaign preview** generation: when the approved plan includes fenced JSON with **`persona_groups`**, resolve names to **`dbo.personas`**, take up to **`variants_per_group`** distinct consumers per group (from snapshot preferences when set), and generate **preview** variants (`is_preview=true`). If **`persona_groups`** are present but nothing can be generated (no matching personas/consumers), the API returns **no** preview variants — **no** silent fallback to unrelated audiences. If the plan has **no** usable **`persona_groups`** list, legacy behavior samples up to **six** random personas (tenant-scoped consumers). See `generate_campaign_preview` in `workers/ad_job_worker/worker.py`.
5. **Produce at scale (batch)** — **Enqueue** one **ad job** per eligible consumer who does **not** yet have an **ad variant** for this **campaign + version**. When the plan lists **`persona_groups`** that **match** DB personas, only consumers whose **primary persona** is in that set are eligible. If the plan lists groups but **none** match the catalog, **no jobs** are enqueued (fail-closed). With no **`persona_groups`** in the plan JSON, **all** tenant consumers remain eligible (legacy). A background **poller** processes jobs **FIFO**, with **retries** capped by `AD_JOB_MAX_ATTEMPTS` (default 3).
6. **Iterate on creative** — Use **version numbers** on variants and **per-version briefs** on campaigns so new creative generations can align to different brief slices.
7. **Campaign assistant chat** — JWT-protected **chat completions**: user message is stored, history + optional filter context is sent to the configured chat model (`SCRIPT_MODEL`, OpenAI-compatible client), assistant reply is stored; responses may include a structured **plan** when the assistant wraps JSON in a Markdown fenced `json` code block (see `detect_plan_in_response` in `services/chat_ai/service.py`).
8. **Connect Meta & view metrics** — OAuth via **`/social-auth/*`** stores encrypted tokens; **`GET /campaigns/{id}/metrics`** serves cached Meta insights and may refresh when stale if the campaign has **`meta_campaign_id`** and an Instagram connection exists.

---

## Major features

| Feature | Intended behavior (from code) |
|---------|----------------------------------|
| **Campaigns** | CRUD by `business_client_id`; `brief` can hold **JSON** whose keys are **version numbers** (string or int) mapping to brief text for that creative version. |
| **Products** | CRUD; images uploaded to Azure **`product-images`**; **`image_name`** is required for automated ad generation (worker loads blob by name). |
| **Consumers** | CRUD; **unique (business_client_id, email)** when email is used; **traits** JSON drives script personalization; **persona** links for segmentation. |
| **Personas** | Global persona library (UUID id, unique name); JSON lists for motivators, pain points, optional tone preferences. |
| **Ad variants** | One row per **campaign × consumer × version** (enforced by generation logic + CRUD helpers); **status** lifecycle includes `Generating` → `completed` or `failed`; **`meta`** holds script JSON and errors; **`media_url`** points to rendered video in blob; **`is_preview`** separates samples from full rollout; **`is_approved`** gates publishing workflows. |
| **Ad jobs & batches** | **Batch** tracks `total_jobs`, `succeeded_jobs`, `failed_jobs`; each **job** carries **`input_json`** with `campaign_id`, `product_id`, `consumer_id`, `version_number` (defaults to **1** if missing). Poller **claims** jobs atomically (`locked_at` / `locked_by`), runs pipeline, updates job + batch counters. |
| **Direct single-ad run** | HTTP **`POST /ad-job-worker/run-ad-job`** runs **`execute_ad_job`** **synchronously** (no batch row required)—useful for debugging or one-off runs. |
| **Signed video URLs** | When Azure is configured, listing/reading ad variants can append a **time-limited SAS** (default **1 hour**) to **`media_url`** for **`ad-videos`** blobs only. |
| **Script moderation** | After script generation, a **policy reviewer** LLM call must return JSON `passed` / `feedback`. If it **fails**, the system **regenerates the script once** using the feedback, then continues (no third automatic pass in code). |
| **Video generation** | Short-form vertical video — duration **`VIDEO_SECONDS`** (**4**, **8**, or **12**; default **12**), portrait **720×1280** — from script + product image via the configured video API; output uploaded to **`ad-videos`**. |

---

## Important business rules

1. **Tenant boundary** — Consumers belong to a **`business_client_id`**. Campaigns carry **`business_client_id`**. APIs should only expose data for the authenticated client where **`get_current_client_id`** or explicit filters are applied (verify each route when changing auth).
2. **Uniqueness** — **One ad variant per (campaign, consumer, version)** for **batch** generation: `generate_campaign_ad_variants` **skips** consumers who already have a variant for that version.
3. **Batch empty case** — If every consumer already has a variant, enqueue returns **`None`** and the API responds with **“No ad variants to generate”** (not an error).
4. **Preview sampling** — When the plan has **no** ``persona_groups`` list, preview uses **`random.sample`** on **all personas** (up to 6) and **`random.choice`** among **tenant** consumers per persona—**not deterministic** across calls. When **`persona_groups`** are present, selection follows the plan only; empty results do **not** fall back to random sampling.
5. **Job ordering** — Pending jobs are processed **oldest first** (`created_at` ascending).
6. **Failed jobs** — After **`MAX_ATTEMPTS`**, jobs stop being picked as **pending**; invalid **`input_json`** is marked **failed** **without** incrementing **`attempt_count`** (parse happens before claim).
7. **Moderation** — Scripts must pass brand-safety norms suitable for **general-audience** social ads (see moderation prompt in `script_moderation_worker`).
8. **Credits / billing** — `business_clients` has **`credits_balance`** and **`subscription_tier`**; **deduction rules are not centralized** in the snippets reviewed—treat billing as **product policy** to enforce consistently when implemented.

---

## Domain glossary

| Term | Meaning |
|------|---------|
| **Business client** | The paying organization / account (login entity). |
| **Campaign** | A marketing push with status, budget, dates, goal, audience, product context, and versioned **brief** text. |
| **Product** | Something sold or promoted; must have a stored **image** for automated video generation. |
| **Consumer** | A modeled audience member (traits + optional persona); receives **personalized** ad variants. |
| **Persona** | A segment archetype (motivators, pain points, tones) used to cluster consumers and to **sample** previews. |
| **Ad variant** | A concrete creative: script + video URL + status for one **campaign × consumer × version**; may be **preview** or production-scale output. |
| **Version number** | Integer creative iteration key; selects **which brief slice** to use from `campaign.brief` JSON. |
| **Ad job** | A unit of async work: inputs in JSON, status, attempts, optional lock fields, link to a **batch**. |
| **Ad job batch** | Groups many jobs; tracks aggregate success/failure counts for progress UI or ops. |

---

## Correct behavior in ambiguous cases

| Situation | Intended behavior |
|-----------|-------------------|
| **Brief missing or invalid JSON** | `_brief_for_version` returns **empty string**; generation still runs with **no** extra strategic brief (only other campaign fields passed where applicable). |
| **Moderation fails first time** | **One** regeneration with **`moderation_feedback`**; if the second script is still bad, code **does not** loop again—downstream video may still run unless additional checks are added. |
| **Product has no `image_name`** | **`execute_ad_job` raises** before generation; variant ends **`failed`** with error in **`meta`**. |
| **Image download/resize fails** | Resize falls back to **original bytes**; other failures surface as **failed** variant. |
| **Video job times out** | After **max poll attempts** (~10 minutes at 5s), raises **`RuntimeError`**; job marked failed, batch **failed** counter incremented. |
| **Duplicate preview vs production** | **Preview** variants are **`is_preview=true`**; listing can filter them. Full batch jobs create **non-preview** variants by default (`execute_ad_job(..., is_preview=False)` from poller). |
| **SAS not appended** | If **`AZURE_STORAGE_CONNECTION_STRING`** is unset, or URL is not a recognized **`ad-videos`** blob URL, API returns **raw `media_url`** (may be unusable without separate auth). |
| **Chat without SCRIPT_API_KEY / SCRIPT_BASE_URL** | Service raises; endpoint should surface a **clear configuration error** to the client (translate in route if needed). |

---

## Edge cases users care about

- **“How many previews will I get?”** — Up to **six**, and **fewer** if there are fewer than six personas, or if some personas have **no consumers**.
- **“Will the same preview run twice look identical?”** — **No**—randomness in persona and consumer selection.
- **“I changed the brief—what happens to old variants?”** — Existing **ad_variant** rows are unchanged; new runs need a **new version** or new jobs to pick up new brief text for that version key.
- **“Job stuck?”** — Check **`ad_jobs.status`**, **`attempt_count`**, **`error_message`**, and **`ad_variants.status` / `meta`**; locks should clear on completion or failure paths; transient poller errors may **release** lock back to **pending**.
- **“Can I watch the video later?”** — SAS links **expire** (default **1 hour**); clients may need to **refetch** the variant to get a fresh URL.
- **“Is my data isolated from other businesses?”** — **Intended** via `business_client_id` on core entities; any new endpoint must **preserve** that boundary.

---

## Related docs

| Doc | Purpose |
|-----|---------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | How components and data flows are wired. |
| [BACKEND.md](./BACKEND.md) | How to implement behavior without breaking structure. |
| [FRONTEND.md](./FRONTEND.md) | How the UI is organized and should behave. |
| [TESTING.md](./TESTING.md) | How to prove behavior with tests and CI. |
| [references/](./references/) | Quick lookup (API, env, persistence). |
| [AGENTS.md](../AGENTS.md) | How to run, test, and navigate the repo. |
| [README.md](../README.md) | High-level product pitch and setup. |
