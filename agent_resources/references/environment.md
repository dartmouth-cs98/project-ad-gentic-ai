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
| `SCRIPT_MODEL` | Model id for script/moderation/chat client paths and **`consumer_traits_description`** (chat completions) |
| `SCRIPT_API_KEY` | Key for OpenAI-compatible client (script generation via **`AsyncOpenAI`**, **consumer narrative from traits**, chat completions, some workers) |
| `SCRIPT_BASE_URL` | Base URL for same client |
| `VIDEO_API_KEY` | OpenAI-compatible video generation (`ad_video_generation_worker`) |
| `VIDEO_SECONDS` | Clip length for video API: **`4`**, **`8`**, or **`12`** (default **`12`**). Drives script beat template and audio guards (`utils/video_timing.py`). |

### Email (verification / password reset)

| Variable | Role |
|----------|------|
| `RESEND_API_KEY` | Transactional email (verification + password reset) |
| `RESEND_FROM_EMAIL` | From address for Resend |
| `EMAIL_VERIFICATION_TOKEN_TTL_MINUTES` | Default **`15`** |

### Google Sign-In

| Variable | Role |
|----------|------|
| `GOOGLE_CLIENT_SECRET` | Server-side OAuth for **`POST /auth/google`** |

### Meta (Instagram OAuth + insights)

| Variable | Role |
|----------|------|
| `META_APP_ID` | Meta app |
| `META_APP_SECRET` | Meta app |
| `META_REDIRECT_URI` | Must match Meta app “Valid OAuth Redirect URIs” (e.g. `…/social-auth/callback`) |
| `META_FRONTEND_URL` | Post-OAuth browser redirect target |

### Token encryption (social connections)

| Variable | Role |
|----------|------|
| `FERNET_SECRET_KEY` | Fernet key for **encrypted** OAuth tokens in **`social_connections`** |

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
