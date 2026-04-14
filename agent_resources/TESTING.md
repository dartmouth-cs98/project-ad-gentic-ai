# Testing guide

This document answers: **“How do I prove my change works?”** It reflects **what the repo does today** plus practical expectations for new work.

---

## Philosophy (test pyramid)

We aim for a **short, fast base** of **unit tests**, a **middle layer** of **integration tests** (API + in-memory DB + mocks), and **few** **end-to-end** checks—because E2E is slow and brittle without dedicated tooling.

| Layer | Goal | Speed | Count (directional) |
|-------|------|--------|---------------------|
| **Unit** | Pure logic, parsers, prompt builders, CRUD helpers with mocked DB | Fast | Many |
| **Integration** | FastAPI `TestClient`, real router + **SQLite** session override | Medium | Several per feature |
| **Worker / poller** | `unittest.mock.patch` / `AsyncMock` on I/O and CRUD | Medium | Cover branches |
| **Smoke / import** | `from main import app` (CI) | Fast | Always green |
| **E2E (browser)** | Full stack, real services | Slow | Rare / not automated yet |

**Bias:** Prefer tests that **fail for the right reason** (assertion on behavior, not implementation detail) and **do not call production** APIs or databases.

---

## What kinds of tests exist today

### Backend (`backend/tests/`)

- **API integration:** `TestClient` against **`main.app`**, **`dependency_overrides`** for `get_db` and `get_current_client_id`, **in-memory SQLite** (`StaticPool`), temporary removal of **`dbo`** schema on models for SQLite (`test_consumers.py`, `test_product.py`, etc.).
- **Route unit behavior:** e.g. **`test_ad_variants.py`** uses **`monkeypatch`** on env and CRUD functions to test SAS URL signing without Azure.
- **Services:** **`test_persona_assignment_service.py`**, **`test_consumer_persona_processor.py`**, **`test_script_moderation_worker.py`** — mocks for LLM clients, **no network**.
- **Workers / poller:** **`test_ad_job_worker.py`**, **`test_ad_job_poller.py`** — **`pytest.importorskip("azure.storage.blob")`** when imports pull Azure; **`patch`** / **`AsyncMock`** for `execute_ad_job`, `claim_ad_job`, etc.
- **ML / numeric:** **`test_gmm_*`**, **`test_gmm_vectorizer`** — deterministic math fixtures.
- **DB connectivity (manual):** **`db_connection_test.py`** — intended as a **script** against **real `.env`** (`python …` or run functions manually); **not** the same pattern as SQLite tests.

### Frontend (`frontend/`)

- **Automated:** **`npm run lint`** and **`npm run build`** in CI only—**no** Jest/Vitest/Playwright wired in `package.json` yet.
- **Typecheck:** **`npx tsc --noEmit`** locally (see [AGENTS.md](../AGENTS.md)).

### CI (GitHub Actions)

| Workflow | What it proves |
|----------|----------------|
| **`run-tests.yml`** | `python -m pytest tests -v` in **`backend/`** with **`JWT_SECRET`**, **`DB_CONNECTION_STRING=sqlite:///test.db`**, **`ALLOWED_ORIGINS`**. |
| **`backend-build.yaml`** | `python -c "from main import app"` with same env pattern. |
| **`lint.yaml`** | Frontend **ESLint**. |
| **`frontend-build.yaml`** | Frontend **Vite build**. |

---

## When to write which kind

| You changed… | Prefer |
|--------------|--------|
| **Pure function** (parse, format, validation helper) | **Unit test** — no DB. |
| **`crud/*`** | **Unit or integration** with SQLite + small fixture data; assert query behavior. |
| **`routes/*`** | **`TestClient`** test: status code, **`detail`**, response shape; **mock** heavy services if needed. |
| **`services/*` / `workers/*`** | **Unit** with mocks; if orchestration is thin, **integration** through route or poller test. |
| **`main.py`** (lifespan, middleware, new router) | **Import smoke** + targeted test if behavior is observable. |
| **Auth / tenant rules** | **Integration** with **`get_current_client_id`** override **and** negative cases (wrong/missing token). |
| **Frontend UI** | Until component tests exist: **manual** critical path + keep **lint/build** green; add **Vitest + RTL** for new complex components if you introduce the stack. |
| **Cross-service E2E** | **Manual** checklist or future Playwright/Cypress; document steps in PR when behavior is user-visible. |

---

## How to run tests

### Backend (matches CI)

```bash
cd backend
pip install -r requirements.txt
export JWT_SECRET=ci-test-secret
export DB_CONNECTION_STRING=sqlite:///test.db
export ALLOWED_ORIGINS=http://localhost:5173
python -m pytest tests -v
```

**Single file / test:**

```bash
cd backend && python -m pytest tests/test_ad_job_poller.py -v
```

**App import smoke (matches `backend-build`):**

```bash
cd backend && JWT_SECRET=ci-test-secret DB_CONNECTION_STRING=sqlite:///test.db ALLOWED_ORIGINS=http://localhost:5173 \
  python -c "from main import app"
```

### Real database connectivity (optional, local)

```bash
cd backend
# Ensure .env points at a reachable DB
python tests/db_connection_test.py
```

Do **not** rely on this for CI; use for **local debugging** only.

### Frontend

```bash
cd frontend && npm ci && npm run lint && npm run build
npx tsc --noEmit
```

---

## Fixtures and mocking rules

1. **Path setup:** Many tests prepend **`backend/`** to **`sys.path`** so imports match runtime layout—**keep this consistent** when adding new test packages.
2. **SQLite vs SQL Server:** ORM models use **`schema="dbo"`**; SQLite tests often **strip schema** on specific tables in fixtures and **`create_all`** only needed tables—**follow the nearest existing test file** (`test_consumers.py`, `test_product.py`).
3. **`get_db` override:** Use **`app.dependency_overrides[get_db] = _override`** yielding a **session bound to in-memory engine**; reset clients between tests if needed.
4. **JWT:** Override **`get_current_client_id`** to return a fixed **`_TEST_CLIENT_ID`** for happy paths.
5. **Async:** **`pytest.ini`** sets **`asyncio_mode = auto`**; use **`@pytest.mark.asyncio`** where needed (see poller tests).
6. **Optional deps:** Use **`pytest.importorskip("azure.storage.blob", …)`** when importing modules that require Azure SDK so environments without it **skip** instead of erroring obscurely.
7. **LLM / HTTP:** **Never** hit real OpenAI/xAI in unit tests—**`AsyncMock`**, **`MagicMock`**, or patch **`responses.create`** / **`chat.completions.create`** at the boundary used by your code.
8. **Env:** Prefer **`monkeypatch.setenv`** / **`delenv`** over mutating **`os.environ`** globally without cleanup.

---

## Coverage expectations

- **No enforced coverage gate** is configured today (`pytest-cov` is not in `requirements.txt`).
- **Expectation for meaningful changes:** add or extend tests so that **new branches** and **failure modes** you introduce are exercised; reviewers should ask for tests when risk is **auth, money, data loss, or job correctness**.
- **Optional locally:** `pip install pytest-cov` and `pytest tests --cov=. --cov-report=term-missing` from **`backend/`** (may need omit patterns for noise).

---

## Flaky test handling

| Symptom | Likely cause | Fix |
|---------|----------------|-----|
| **Passes alone, fails in suite** | Shared global state (`sys.path`, env, **`get_openai_client.cache_clear`** not called, engine singleton) | Isolate with fixtures; clear caches in **`autouse`** fixture where needed. |
| **Async timing** | Missing **`await`**, wrong **`AsyncMock`** | Use **`pytest-asyncio`** patterns from `test_ad_job_poller.py`. |
| **SQLite locked** | Sessions not closed, **`check_same_thread`** | Use **`StaticPool`** pattern from existing tests. |
| **Skip on CI** | **`importorskip`** for Azure | Ensure **`requirements.txt`** includes **`azure-storage-blob`** (it does); if skip persists, fix import path. |
| **Real network** | Accidental live client | Patch at module **import used by code under test** (target string must match **`where`** the name is looked up). |

**Rule:** Do not **`@pytest.mark.flaky`** retry without fixing root cause unless the flake is **documented** and **tracked** (prefer fixing).

---

## Test data setup

- **Prefer factories** inside the test file or a shared **`tests/factories.py`** (not present yet—**inline helpers** like **`_make_persona`** are the house style).
- **Minimal rows:** Only create **Persona** before **Consumer** when FK order demands it (see consumer tests).
- **UUIDs:** Use **`uuid4()`** for job/batch ids in poller tests.
- **Secrets:** Never put real keys in tests; use **`monkeypatch`** for env vars.
- **CSV / uploads:** **`io.BytesIO`** for **`UploadFile`**-style tests (`test_consumers.py`).

---

## End-to-end guidance

**Not automated in-repo** today. To **prove** a change for reviewers:

1. **Backend:** Run **pytest** + **import smoke**; hit **`/docs`** locally for manual calls with a valid JWT.
2. **Frontend:** **`npm run dev`**, walk **HashRouter** paths (`/#/…`) affected; verify **network** tab calls **`/api`** as expected.
3. **Full stack:** Start **FastAPI** + **Vite** (see [AGENTS.md](../AGENTS.md)); run one **golden path** (sign-in → campaign → generate) when touching **both** sides.
4. **Document** in the PR: env vars used, seed data, and any **known limitations** (e.g. Azure-only features stubbed locally).

When the team adds **Playwright** or similar, this section should gain **one** committed smoke spec and CI job.

---

## Related docs

| Doc | Purpose |
|-----|---------|
| [AGENTS.md](../AGENTS.md) | Commands and directory map. |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | What to smoke-test end-to-end. |
| [BACKEND.md](./BACKEND.md) | Layers and where to put logic. |
| [FRONTEND.md](./FRONTEND.md) | Frontend structure; future component tests. |
| [PRODUCT.md](./PRODUCT.md) | Behaviors worth asserting in tests. |
| [references/ci-and-tooling.md](./references/ci-and-tooling.md) | Workflow file names and local commands. |
