import logging
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from sqlalchemy import text

# Configure logging so logger.info(), etc. show in the terminal
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
    force=True,
)
from fastapi.middleware.cors import CORSMiddleware

#  Worker routes
from workers.ad_job_worker.service import router as ad_job_worker_router
from workers.ad_post_worker.service import router as ad_post_worker_router

#  Auth & onboarding
from routes.auth import router as auth_router

#  Resource routes (CRUD)
from routes.ad_variants import router as ad_variants_router
from routes.ad_jobs import router as ad_jobs_router
from routes.ad_job_batches import router as ad_job_batches_router
from routes.campaigns import router as campaigns_router
from routes.chat_messages import router as chat_messages_router
from routes.consumers import router as consumers_router
from routes.personas import router as personas_router
from routes.product import router as product_router
from routes.chat_completions import router as chat_completions_router

from services.ad_job_poller.service import run_poller
from database import get_engine


logger = logging.getLogger(__name__)


def _ensure_auth_columns_exist() -> None:
    """Best-effort startup migration for auth-related business_client columns."""
    engine = get_engine()
    # Only run this auto-migration path for SQL Server.
    if engine.dialect.name != "mssql":
        return

    statements = [
        """
        IF COL_LENGTH('dbo.business_clients', 'email_verified') IS NULL
        BEGIN
            ALTER TABLE dbo.business_clients
            ADD email_verified BIT NULL;

            UPDATE dbo.business_clients
            SET email_verified = 1
            WHERE email_verified IS NULL;

            ALTER TABLE dbo.business_clients
            ADD CONSTRAINT DF_business_clients_email_verified
            DEFAULT 0 FOR email_verified;

            ALTER TABLE dbo.business_clients
            ALTER COLUMN email_verified BIT NOT NULL;
        END
        """,
        """
        IF COL_LENGTH('dbo.business_clients', 'email_verification_token_hash') IS NULL
        BEGIN
            ALTER TABLE dbo.business_clients
            ADD email_verification_token_hash NVARCHAR(255) NULL;
        END
        """,
        """
        IF COL_LENGTH('dbo.business_clients', 'email_verification_expires_at') IS NULL
        BEGIN
            ALTER TABLE dbo.business_clients
            ADD email_verification_expires_at DATETIME2 NULL;
        END
        """,
        """
        IF COL_LENGTH('dbo.business_clients', 'password_reset_token_hash') IS NULL
        BEGIN
            ALTER TABLE dbo.business_clients
            ADD password_reset_token_hash NVARCHAR(255) NULL;
        END
        """,
        """
        IF COL_LENGTH('dbo.business_clients', 'password_reset_expires_at') IS NULL
        BEGIN
            ALTER TABLE dbo.business_clients
            ADD password_reset_expires_at DATETIME2 NULL;
        END
        """,
        """
        IF COL_LENGTH('dbo.business_clients', 'auth_provider') IS NULL
        BEGIN
            ALTER TABLE dbo.business_clients
            ADD auth_provider NVARCHAR(50) NULL;

            UPDATE dbo.business_clients
            SET auth_provider = 'email'
            WHERE auth_provider IS NULL;
        END
        """,
    ]

    with engine.begin() as conn:
        for stmt in statements:
            conn.execute(text(stmt))
    logger.info("Ensured auth schema columns exist on dbo.business_clients.")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Start the ad_job poller task when the app starts; cancel it on shutdown."""
    import asyncio
    _ensure_auth_columns_exist()
    poller_task = asyncio.create_task(run_poller())
    yield
    poller_task.cancel()
    try:
        await poller_task
    except asyncio.CancelledError:
        pass

app = FastAPI(
    title="Adgentic AI API",
    description="Adgentic AI is a platform that helps businesses create and manage their social media ads.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# CORS middleware 
# Allowed origin separated by comma
_raw_origins = os.environ["ALLOWED_ORIGINS"]
allowed_origins = [o.strip() for o in _raw_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth_router, prefix="/auth", tags=["Auth"])
app.include_router(ad_job_worker_router, prefix="/ad-job-worker", tags=["Ad Job Worker"])
app.include_router(ad_post_worker_router, prefix="/ad-post-worker", tags=["Ad Post Worker"])

# Resource routers (CRUD)
app.include_router(ad_variants_router, prefix="/ad-variants", tags=["Ad Variants"])
app.include_router(ad_jobs_router, prefix="/ad-jobs", tags=["Ad Jobs"])
app.include_router(ad_job_batches_router, prefix="/ad-job-batches", tags=["Ad Job Batches"])
app.include_router(campaigns_router, prefix="/campaigns", tags=["Campaigns"])
app.include_router(chat_messages_router, prefix="/chat-messages", tags=["Chat Messages"])
app.include_router(chat_completions_router, prefix="/chat/completions", tags=["Chat AI"])
app.include_router(consumers_router, prefix="/consumers", tags=["Consumers"])
app.include_router(product_router, prefix="/products", tags=["Products"])
app.include_router(personas_router, prefix="/personas", tags=["Personas"])

# Methods (GET and HEAD) for uptime robot to keep the app alive
@app.api_route("/", methods=["GET", "HEAD"])
async def root():
    """Root endpoint - API health check."""
    return {
        "message": "Adgentic AI API",
        "version": "1.0.0",
        "status": "running",
        "services": [
            "ad-job-worker",
            "ad-post-worker"
        ]
    }

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
