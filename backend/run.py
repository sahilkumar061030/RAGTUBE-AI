"""
Convenience entry point to run the VideoMind FastAPI backend.
Usage:
    python run.py
"""

import uvicorn

if __name__ == "__main__":
    print("Starting VideoMind FastAPI Server on http://localhost:8000 ...")
    print("API Documentation available at: http://localhost:8000/docs")
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
