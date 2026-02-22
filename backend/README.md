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
3. **Script Creation Worker** - `/script-creation-worker/hello`

## Testing Hello Endpoints

```bash
curl http://localhost:8000/ad-job-worker/hello
curl http://localhost:8000/ad-post-worker/hello
curl http://localhost:8000/script-creation-worker/hello
```

## Database Setup

The backend connects to an Azure SQL database via ODBC Driver 18.

### 1. Install ODBC Driver 18 (macOS)

Check if it's already installed:
```bash
odbcinst -q -d -n "ODBC Driver 18 for SQL Server"
```

If not found, install it:
```bash
brew tap microsoft/mssql-release https://github.com/Microsoft/homebrew-mssql-release
brew install msodbcsql18
```

### 2. Configure environment variables

Copy `.env.example` to `.env` (or ask a teammate for the `.env` file) and fill in:
```
DB_PASSWORD=<your_password>
DB_CONNECTION_STRING=<your_connection_string>
```

### 3. Test the connection

```bash
python test_db_connection.py
```

**Expected output:**
```
Testing database connection...
DB connection successful: (1,)
```

**Common errors:**

| Error | Fix |
|---|---|
| `Can't open lib 'ODBC Driver 18 for SQL Server'` | Install ODBC Driver 18 (step 1) |
| `Login failed` | Check `DB_PASSWORD` in `.env` |
| `Connection timeout` / `Client IP not allowed` | Whitelist your IP in the Azure SQL firewall (step 4) |

### 4. Whitelist your IP in Azure SQL firewall

If you see a `Client with IP address '...' is not allowed to access the server` error, add your IP to the firewall.

**Option A — Azure Portal (easiest)**

1. Go to [portal.azure.com](https://portal.azure.com)
2. Navigate to **SQL servers** → `ad-gentic-dev`
3. In the left menu: **Security** → **Networking**
4. Under **Firewall rules**, click **+ Add your client IPv4 address**
5. Click **Save** and wait ~2 minutes, then re-run the test script

> If you're on a network where your IP changes often (e.g. university WiFi), you may need to repeat this each time your IP changes.
