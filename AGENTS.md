# Agent / contributor map

Operational index for **Adgentic AI**: an AI-assisted system for business owners to **generate, deploy, and track** social ads (see [README.md](README.md) for architecture diagram and service list).

**Agent resources** (prompts, checklists, domain notes, and other material for AI/human agents) live in [`agent_resources/`](agent_resources/). **Lookup tables** (API paths, env vars, routes, DB tables) are in [`agent_resources/references/`](agent_resources/references/). **Design docs for major changes** go in [`agent_resources/design-docs/`](agent_resources/design-docs/) *before* implementation—see [Major changes (design doc first)](#major-changes-design-doc-first). **Task-specific execution plans** (steps, acceptance criteria, file pointers) live in [`exec-plans/`](exec-plans/)—see [Execution plans (task details)](#execution-plans-task-details).

---

## Execution plans (task details)

**Agents:** when you are given work—especially a ticket, issue, or chat that points at this repo—**look in [`exec-plans/`](exec-plans/) first** for Markdown files that describe *this* task.

1. **Search** `exec-plans/` for a file whose name or title matches the assignment (or open the path your human referenced).
2. **Follow** the plan’s steps, constraints, and **definition of done**; treat that doc as authoritative for scope unless the user overrides it in chat.
3. **Cross-check** with [`agent_resources/`](agent_resources/) for system context (architecture, product rules, API lookups)—exec plans are *task* detail; agent resources are *system* reference.
4. **Major structural work** may still require a [design doc](#major-changes-design-doc-first) in `agent_resources/design-docs/` before coding; the exec plan should say so if applicable.

If `exec-plans/` has no file for your task, proceed from the user’s instructions and the main docs in `agent_resources/`.

Convention and layout: [exec-plans/README.md](exec-plans/README.md).

---

## Run the app

| Path | Command | Notes |
|------|---------|--------|
| **Backend (local)** | `cd backend && python3 -m venv venv && source venv/bin/activate && pip install -r requirements.txt && python3 main.py` | API + docs: `http://localhost:8000` (`/docs`). Copy `backend/.env.example` → `backend/.env`. |
| **Frontend (local)** | `cd frontend && npm install && npm run dev` | Dev server (Vite; default port per Vite, often `5173`). Copy `frontend/.env` if your team uses one. |
| **Docker (repo Makefile)** | `make up` | Intended: backend `:8000`, frontend `:3000` per [README.md](README.md). Requires working `docker-compose` setup. |

---

## Tests, lint, typecheck

| What | Where | Command |
|------|--------|---------|
| **Backend tests** | `backend/` | `python -m pytest tests -v` (use env vars like CI: `JWT_SECRET`, `DB_CONNECTION_STRING`, `ALLOWED_ORIGINS` — see [.github/workflows/run-tests.yml](.github/workflows/run-tests.yml)) |
| **Frontend lint** | `frontend/` | `npm run lint` |
| **Frontend build** | `frontend/` | `npm run build` (also exercised in CI) |
| **Frontend typecheck** | `frontend/` | `npx tsc --noEmit` (no dedicated npm script today) |

Root `package.json` has no real test script; **CI** is the source of truth: `.github/workflows/run-tests.yml`, `lint.yaml`, `frontend-build.yaml`, `backend-build.yaml`.

---

## Directories (ownership)

| Area | Role |
|------|------|
| `agent_resources/` | Agent-oriented docs and assets (not application runtime code). |
| `agent_resources/design-docs/` | Design write-ups for **major** changes; create **before** implementation. |
| `exec-plans/` | **Task-level** plans: steps, acceptance criteria; agents read these when completing assigned work. |
| `frontend/` | Vite + React UI (`src/`), Tailwind, client API usage. |
| `backend/` | FastAPI app: `main.py`, `routes/`, `services/`, `workers/`, `models/`, `crud/`, `schemas/`, `tests/`, `scripts/`. |
| `.github/workflows/` | PR checks (pytest, ESLint, builds). |
| `Makefile`, `docker-compose.yml` | Local orchestration helpers. |
| `render.yaml` | Deployment wiring for the API (treat as infra). |

---

## Do not touch casually

- **`backend/.env`, `frontend/.env`, secrets, API keys** — never commit; mirror `backend/.env.example` patterns.
- **`backend/main.py` lifespan / background tasks** — affects pollers and process-wide behavior; coordinate before changing.
- **Auth (`routes/auth.py`, JWT dependencies, `dependencies.py`)** — security-sensitive; require tests and review.
- **`render.yaml` / production URLs** — infra; avoid drive-by edits.
- **Database URL / Azure / blob config** — breaking changes affect all environments.

---

## Major changes (design doc first)

**Agents and contributors:** for **major** work (new features, cross-cutting refactors, auth/schema/job pipeline changes, new integrations), **do not start implementation** until a design doc exists in [`agent_resources/design-docs/`](agent_resources/design-docs/).

1. **Read** any matching file in [`exec-plans/`](exec-plans/) for this work, plus [agent_resources/ARCHITECTURE.md](agent_resources/ARCHITECTURE.md), [PRODUCT.md](agent_resources/PRODUCT.md), and the relevant [BACKEND.md](agent_resources/BACKEND.md) / [FRONTEND.md](agent_resources/FRONTEND.md) sections so the design matches house patterns.
2. **Add** a new Markdown file under `agent_resources/design-docs/` (naming and outline: [design-docs/README.md](agent_resources/design-docs/README.md)).
3. **Cover** problem, goals/non-goals, proposed behavior, API/DB impacts, alternatives, rollout, and test plan.
4. **Pause** for human review or explicit approval when the project workflow requires it (see [CLAUDE.md](CLAUDE.md) for review-heavy work).
5. **Implement** in code, then update the design doc or PR with what actually shipped.

Small, low-risk edits can skip this folder.

---

## Making changes safely

1. Scope small PRs; match existing patterns in the package you edit (`frontend` vs `backend`).
2. Run **backend pytest** and **frontend lint + build** (and `tsc --noEmit` for TS changes).
3. Add or update **tests** for backend logic (`backend/tests/`); keep CI green.
4. For API or schema changes, update **FastAPI routes + Pydantic schemas** together and check callers.

---

## Deeper documentation

| Doc | Contents |
|-----|----------|
| [README.md](README.md) | Product overview, architecture, Docker/Make quick start, tech stack. |
| [agent_resources/ARCHITECTURE.md](agent_resources/ARCHITECTURE.md) | System shape, data flows, deployment. |
| [agent_resources/PRODUCT.md](agent_resources/PRODUCT.md) | Product behavior, journeys, domain terms. |
| [agent_resources/BACKEND.md](agent_resources/BACKEND.md) | FastAPI layers, auth, jobs, API conventions. |
| [agent_resources/FRONTEND.md](agent_resources/FRONTEND.md) | Vite/React structure, state, styling, pitfalls. |
| [agent_resources/TESTING.md](agent_resources/TESTING.md) | Test pyramid, pytest, CI, fixtures. |
| [agent_resources/references/](agent_resources/references/) | Lookup tables (API, env, routes, DB, CI). |
| [agent_resources/design-docs/](agent_resources/design-docs/) | Design docs for major changes (before implementation). |
| [exec-plans/](exec-plans/) | Task execution plans (read before implementing assigned work). |
| [backend/README.md](backend/README.md) | Backend runbook, ports, worker route prefixes. |
| [frontend/README.md](frontend/README.md) | Vite-oriented notes (may be generic template text). |
| [CLAUDE.md](CLAUDE.md) | AI/review workflow expectations for large changes. |
