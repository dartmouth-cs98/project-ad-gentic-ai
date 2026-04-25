# External integrations lookup

Where the code talks to the outside world (excluding the browser).

| Integration | Python / package | Typical entrypoints | Config |
|-------------|------------------|---------------------|--------|
| **Azure Blob** | `azure-storage-blob` | `BlobClient`, `ContainerClient`; `routes/product.py`, `routes/ad_variants.py`, `workers/ad_job_worker/worker.py` | `AZURE_STORAGE_CONNECTION_STRING` |
| **Azure identity** | `azure-identity` | `database.py` (`DefaultAzureCredential`) when `USE_AZURE_AD=true` | `DB_ODBC_CONNECTION_STRING` |
| **OpenAI API** | `openai` (`AsyncOpenAI`) | `core/openai_client.py`, video worker, moderation worker, persona code paths | `OPENAI_API_KEY`, `VIDEO_API_KEY`, `SCRIPT_*` |
| **xAI / Grok** | `openai` client + `xai_sdk` | `services/chat_ai/service.py` (chat); `workers/script_creation_worker/worker.py` (scripts) | `SCRIPT_API_KEY`, `SCRIPT_BASE_URL`, model env |
| **SQL Server / ODBC** | `sqlalchemy`, `pyodbc` | `database.py` | URL or Azure AD ODBC path |

## Blob containers (hardcoded in code paths)

| Container | Typical use |
|-----------|-------------|
| `product-images` | Product image blobs; worker reads by `image_name` |
| `ad-videos` | Rendered MP4 uploads; SAS signing in ad variant routes |

## JWT

- Library: **`python-jose`** (`dependencies.py`).
- Signing: **`JWT_SECRET`**, HS256, 7-day expiry via **`create_access_token`**.
