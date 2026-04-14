# CI and tooling reference

## GitHub Actions (`.github/workflows/`)

| Workflow file | Trigger | What runs |
|---------------|---------|-----------|
| `run-tests.yml` | PR → `main` | `pip install` + `python -m pytest tests -v` in **`backend/`** |
| `backend-build.yaml` | PR → `main` | `python -c "from main import app"` in **`backend/`** |
| `lint.yaml` | PR → `main` | `npm ci` + `npm run lint` in **`frontend/`** |
| `frontend-build.yaml` | PR → `main` | `npm ci` + `npm run build` in **`frontend/`** |

Backend jobs set: `JWT_SECRET`, `DB_CONNECTION_STRING=sqlite:///test.db`, `ALLOWED_ORIGINS`.

## Local commands (short)

| Goal | Command |
|------|---------|
| Backend dev | `cd backend && source venv/bin/activate && python3 main.py` |
| Backend tests | See [TESTING.md](../TESTING.md) |
| Frontend dev | `cd frontend && npm run dev` |
| Frontend lint | `cd frontend && npm run lint` |
| Frontend build | `cd frontend && npm run build` |
| Frontend typecheck | `cd frontend && npx tsc --noEmit` |

## Deploy hint

- `render.yaml`: API Docker service, context **`backend/`**.

## ESLint

- Config: `frontend/eslint.config.js`
- Ignores: `dist`, `.next`, `node_modules`
