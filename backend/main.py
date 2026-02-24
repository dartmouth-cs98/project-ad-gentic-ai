from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

#  Worker routes
from workers.ad_job_worker.service import router as ad_job_worker_router
from workers.ad_post_worker.service import router as ad_post_worker_router
from workers.script_creation_worker.service import router as script_creation_worker_router

#  Auth & onboarding
from routes.auth import router as auth_router

#  Resource routes (CRUD)
from routes.ad_variants import router as ad_variants_router
from routes.consumers import router as consumers_router

app = FastAPI(
    title="Adgentic AI API",
    description="Adgentic AI is a platform that helps businesses create and manage their social media ads.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth_router, prefix="/auth", tags=["Auth"])
app.include_router(ad_job_worker_router, prefix="/ad-job-worker", tags=["Ad Job Worker"])
app.include_router(ad_post_worker_router, prefix="/ad-post-worker", tags=["Ad Post Worker"])
app.include_router(script_creation_worker_router, prefix="/script-creation-worker", tags=["Script Creation Worker"])

# Resource routers (CRUD)
app.include_router(ad_variants_router, prefix="/ad-variants", tags=["Ad Variants"])
app.include_router(consumers_router, prefix="/consumers", tags=["Consumers"])

@app.get("/")
async def root():
    """Root endpoint - API health check."""
    return {
        "message": "Adgentic AI API",
        "version": "1.0.0",
        "status": "running",
        "services": [
            "ad-job-worker",
            "ad-post-worker",
            "script-creation-worker"
        ]
    }

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
