"""
Application configuration.
Loads environment variables from the project root .env file.
"""

import os
from pathlib import Path

from dotenv import load_dotenv, find_dotenv

# find_dotenv() searches up the directory tree for .env
# This works whether uvicorn is run from backend/ or project root
load_dotenv(find_dotenv())


class Settings:
    """Application settings loaded from environment variables."""

    GOOGLE_API_KEY: str = os.getenv("GOOGLE_API_KEY", "")
    TRANSCRIPT_API_KEY: str = os.getenv("TRANSCRIPT_API_KEY", "")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-3.5-flash")

    # CORS: frontend origin for local development
    FRONTEND_ORIGIN: str = os.getenv(
        "FRONTEND_ORIGIN", "http://localhost:3000"
    )

    # Directory for persisted FAISS indexes
    DATA_DIR: Path = Path(__file__).resolve().parent.parent / "data"
    INDEXES_DIR: Path = DATA_DIR / "indexes"

    def __init__(self):
        self.INDEXES_DIR.mkdir(parents=True, exist_ok=True)
        if self.GOOGLE_API_KEY and not os.getenv("GOOGLE_API_KEY"):
            os.environ["GOOGLE_API_KEY"] = self.GOOGLE_API_KEY


settings = Settings()

