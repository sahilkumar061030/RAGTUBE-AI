"""
FastAPI application entry point for VideoMind API.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import videos_router

app = FastAPI(
    title="VideoMind API",
    description="AI-Powered YouTube Video Q&A using Retrieval-Augmented Generation (RAG)",
    version="0.1.0",
)

# CORS setup for http://localhost:3000
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_ORIGIN, "http://localhost:3000", "http://127.0.0.1:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(videos_router, prefix="/api/videos", tags=["Videos"])


@app.get("/", summary="Root endpoint")
def root():
    """Root info endpoint."""
    return {
        "name": "VideoMind API",
        "version": "0.1.0",
        "docs_url": "/docs",
        "health_url": "/api/health",
        "status": "operational",
    }


@app.get("/api/health", summary="Health check")
def health_check():
    """Health check endpoint."""
    return {"status": "ok"}
