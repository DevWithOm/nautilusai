"""
main.py — NautilusAI FastAPI Application Entry Point
======================================================
Bootstraps the FastAPI server for the NautilusAI backend:

  1. Loads environment variables from /backend/.env via python-dotenv.
  2. Configures structured logging.
  3. Initialises the FastAPI app with OpenAPI metadata.
  4. Registers CORSMiddleware to allow the Vite frontend (port 5173)
     and any other origin during development.
  5. Mounts all API routers under /api/v1.
  6. Exposes a /health check endpoint for infra readiness probes.

Run with:
    uvicorn main:app --reload --host 0.0.0.0 --port 8000
"""

import logging
import os

from dotenv import load_dotenv

# ────────────────────────────────────────────────────────────────────────────
# Step 1: Load .env FIRST — before any other app code runs — so that
# GEMINI_API_KEY and CLOUD_COVER_THRESHOLD are available to every module.
# ────────────────────────────────────────────────────────────────────────────
load_dotenv()   # reads /backend/.env automatically when CWD == /backend

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Import routers
from routers import zones as zones_router
from routers import stream as stream_router
from routers import feedback as feedback_router
from routers import chat as chat_router

# ────────────────────────────────────────────────────────────────────────────
# Step 2: Configure logging
# ────────────────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("nautilusai")


# ────────────────────────────────────────────────────────────────────────────
# Step 3: Initialise FastAPI app with rich OpenAPI metadata
# ────────────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="NautilusAI — Living Ocean Explorer",
    description=(
        "Real-time multi-agent marine anomaly monitoring platform. "
        "Powered by a LangGraph specialist swarm coordinated by Gemini 1.5 Pro. "
        "Streams ecological analysis over WebSocket to a deck.gl 3D frontend."
    ),
    version="1.0.0",
    docs_url="/docs",      # Swagger UI
    redoc_url="/redoc",    # ReDoc
)


# ────────────────────────────────────────────────────────────────────────────
# Step 4: CORS Middleware
# Allows the Vite dev server (http://localhost:5173) and any other origin
# to make cross-origin requests during development.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",          # local dev
        "http://localhost:3000",          # local dev alt
        os.getenv("FRONTEND_URL", "http://localhost:5173"),   # fallback to dev origin
    ],
    allow_origin_regex=os.getenv("FRONTEND_REGEX", r"https://.*\.vercel\.app"), # regex for Vercel preview URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ────────────────────────────────────────────────────────────────────────────
# Step 5: Mount routers under /api/v1
# ────────────────────────────────────────────────────────────────────────────
app.include_router(
    zones_router.router,
    prefix="/api/v1",
)

app.include_router(
    stream_router.router,      # WebSocket — note: no HTTP prefix stripping
    prefix="/api/v1",
)

app.include_router(
    feedback_router.router,
    prefix="/api/v1",
)

app.include_router(
    chat_router.router,
    prefix="/api/v1",
)


# ────────────────────────────────────────────────────────────────────────────
# Step 6: Health check endpoint
# Used by Docker / k8s readiness probes and the frontend's connection guard.
# ────────────────────────────────────────────────────────────────────────────
@app.get(
    "/health",
    summary="Health check",
    description="Returns 200 OK when the server is running and .env is loaded.",
    tags=["Meta"],
)
async def health_check() -> dict:
    """
    GET /health

    Confirms the server is alive and that the critical GEMINI_API_KEY
    environment variable has been loaded from .env.
    """
    gemini_loaded = bool(os.getenv("GEMINI_API_KEY"))
    return {
        "status":        "ok",
        "version":       "1.0.0",
        "gemini_loaded": gemini_loaded,
        "cloud_cover_threshold": int(os.getenv("CLOUD_COVER_THRESHOLD", "5")),
    }


# ────────────────────────────────────────────────────────────────────────────
# Startup / Shutdown lifecycle hooks
# ────────────────────────────────────────────────────────────────────────────
@app.on_event("startup")
async def on_startup() -> None:
    """Runs once when Uvicorn starts the application."""
    logger.info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    logger.info("  NautilusAI Backend — Living Ocean Explorer v1.0.0")
    logger.info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    logger.info("  Endpoints:")
    logger.info("    GET  http://localhost:8000/api/v1/zones")
    logger.info("    WS   ws://localhost:8000/api/v1/agents/stream")
    logger.info("    POST http://localhost:8000/api/v1/feedback")
    logger.info("    GET  http://localhost:8000/health")
    logger.info("    GET  http://localhost:8000/docs  (Swagger UI)")
    logger.info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    gemini_status = "✅ LOADED" if os.getenv("GEMINI_API_KEY") else "❌ MISSING"
    logger.info("  GEMINI_API_KEY: %s", gemini_status)
    logger.info("  CLOUD_COVER_THRESHOLD: %s days", os.getenv("CLOUD_COVER_THRESHOLD", "5"))
    logger.info("  DEMO_ZONES for AS-07 are loaded.")
    logger.info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")


@app.on_event("shutdown")
async def on_shutdown() -> None:
    """Runs once when Uvicorn shuts down."""
    logger.info("NautilusAI Backend shutting down. Goodbye. 🌊")
