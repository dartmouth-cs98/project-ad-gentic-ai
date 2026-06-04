# Backend API

## Quick Start

1. Create a virtual environment and activate it:
```bash
python3 -m venv venv
source venv/bin/activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Run the server (single port: 8000):
```bash
python3 main.py
```

The API will be available at `http://localhost:8000` with auto-generated docs at `/docs`.

## Services

All services run on **port 8000** with different route prefixes:

1. **Ad Job Worker** - `/ad-job-worker/hello`
2. **Ad Post Worker** - `/ad-post-worker/hello`

Script creation is a pipeline step (no HTTP); use `workers.script_creation_worker.generate_script(data)` from code.

## Sync Labs lip sync (optional)

When `SYNC_LIPSYNC_ENABLED=true`, `SYNC_API_KEY` is set, and the video provider classifier marks `lip_sync_risk` on the variant meta, the ad job demuxes the Sora/Veo MP4 (requires **ffmpeg** on the host) and post-processes via [Sync Generate API](https://sync.so/docs/api-reference/api/generate-api/create) (`sync-3` by default). Sync failures fail the ad job (no raw-video fallback).

Local ffmpeg: `brew install ffmpeg` (macOS) or `apt install ffmpeg` (Linux). Docker image includes ffmpeg.

See `backend/.env.example` for `SYNC_*` variables and `exec-plans/2026-05-25-sync-labs-lipsync-pipeline.md`.

## Testing Hello Endpoints

```bash
curl http://localhost:8000/ad-job-worker/hello
curl http://localhost:8000/ad-post-worker/hello
```
