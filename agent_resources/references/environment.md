# Environment variables reference

Values are **representative**; authoritative defaults live in code and **`backend/.env.example`**.

## Backend (`backend/.env`)

Loaded via **`python-dotenv`** from **`backend/.env`** (`database.py`, several workers).

### Required for a running API (typical)

| Variable | Role |
|----------|------|
| `JWT_SECRET` | HS256 signing; **required** at import for `routes/auth.py` |
| `ALLOWED_ORIGINS` | Comma-separated CORS origins; read at startup (**KeyError if missing**) |
| `DB_CONNECTION_STRING` | SQLAlchemy URL; placeholder `${DB_PASSWORD}` may be substituted |
| `DB_PASSWORD` | Injected into `DB_CONNECTION_STRING` when used |

### Database (Azure AD alternative)

| Variable | Role |
|----------|------|
| `USE_AZURE_AD` | When `true`, use ODBC + `DefaultAzureCredential` |
| `DB_ODBC_CONNECTION_STRING` | ODBC string for Azure AD path |

### LLM / media (feature-dependent)

| Variable | Role |
|----------|------|
| `OPENAI_API_KEY` | `core/openai_client.py` (e.g. consumer persona flows) |
| `SCRIPT_MODEL` | Model id for script/moderation/chat client paths |
| `SCRIPT_API_KEY` | Key for OpenAI-compatible client (script moderation, Grok chat, some workers) |
| `SCRIPT_BASE_URL` | Base URL for same client |
| `VIDEO_API_KEY` | OpenAI-compatible video generation (`ad_video_generation_worker`) |

### Azure Storage

| Variable | Role |
|----------|------|
| `AZURE_STORAGE_CONNECTION_STRING` | Blob upload/download + SAS signing in routes/workers |
| `AZURE_STORAGE_VIDEO_CONTAINER` | Documented in `.env.example` (default `ad-videos`); code may hardcode container names in places |

### Ad job poller

| Variable | Role |
|----------|------|
| `AD_JOB_POLL_INTERVAL_SECONDS` | Default `5` |
| `AD_JOB_MAX_ATTEMPTS` | Default `3` |

## CI (GitHub Actions)

Backend workflows set at least:

- `JWT_SECRET=ci-test-secret`
- `DB_CONNECTION_STRING=sqlite:///test.db`
- `ALLOWED_ORIGINS=http://localhost:5173`

## Frontend (`frontend/.env` — optional)

| Variable | Role |
|----------|------|
| `VITE_ENV` | Unset defaults to **`local`** in `api/config.ts`; when `ENV === 'local'`, **`API_BASE_URL`** is `/api` |
| `VITE_API_URL` | Backend origin for non-local builds and Vite proxy default (`vite.config.ts` uses it as proxy target, default `http://localhost:8000`) |

## Local storage (browser)

Not env vars, but configuration-like (see [frontend.md](./frontend.md)):

- `adgentic_token`, `adgentic_current_user`, `adgentic_client_id`
- `theme` (light/dark)
