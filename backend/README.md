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

## Testing Hello Endpoints

```bash
curl http://localhost:8000/ad-job-worker/hello
curl http://localhost:8000/ad-post-worker/hello
```
