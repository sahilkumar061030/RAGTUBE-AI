"""
Comprehensive Integration Tests for VideoMind FastAPI Backend.
Tests health, video ingestion, status, Q&A RAG pipeline, and hallucination guardrails.
"""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_api():
    print("=" * 60)
    print("RUNNING VIDEOMIND BACKEND INTEGRATION TESTS")
    print("=" * 60)

    # 1. Health & Root
    print("\n[1] Health Check")
    r_health = client.get("/api/health")
    assert r_health.status_code == 200
    assert r_health.json() == {"status": "ok"}
    print("    [OK] /api/health returned 200 OK")

    # 2. List Videos
    print("\n[2] List Indexed Videos")
    r_list = client.get("/api/videos")
    assert r_list.status_code == 200
    videos = r_list.json()
    print(f"    [OK] Found {len(videos)} indexed video(s)")

    # 3. Video Status
    video_id = "E0Hmnixke2g"
    print(f"\n[3] Check Video Status ({video_id})")
    r_status = client.get(f"/api/videos/{video_id}/status")
    assert r_status.status_code == 200
    data = r_status.json()
    assert data["is_indexed"] is True
    print(f"    [OK] Video '{data['title']}' is indexed with {data['chunk_count']} chunks")

    # 4. Ask Valid Question (RAG with Gemini)
    print("\n[4] Ask Question (RAG Q&A)")
    r_ask = client.post(
        f"/api/videos/{video_id}/ask",
        json={"question": "What is supervised learning?"}
    )
    assert r_ask.status_code == 200
    res = r_ask.json()
    assert len(res["answer"]) > 20
    assert len(res["sources"]) > 0
    print("    [OK] Q&A returned answer with", len(res["sources"]), "citations")
    print("    Sample Citation Timestamp:", res["sources"][0]["start_timestamp"], "->", res["sources"][0]["end_timestamp"])

    # 5. Out-of-Context Question (Guardrail)
    print("\n[5] Out-of-Context Guardrail")
    r_ooc = client.post(
        f"/api/videos/{video_id}/ask",
        json={"question": "How do you bake a chocolate cake?"}
    )
    assert r_ooc.status_code == 200
    ans = r_ooc.json()["answer"].lower()
    assert "don't know" in ans or "transcript" in ans
    print("    [OK] Model successfully refused out-of-context question")

    # 6. Suggested Questions
    print("\n[6] Suggested Questions")
    r_sugg = client.get(f"/api/videos/{video_id}/suggested-questions")
    assert r_sugg.status_code == 200
    suggs = r_sugg.json()["suggested_questions"]
    assert len(suggs) >= 3
    print(f"    [OK] Returned {len(suggs)} suggested questions")

    print("\n" + "=" * 60)
    print("ALL TESTS PASSED SUCCESSFULLY!")
    print("=" * 60)

if __name__ == "__main__":
    test_api()
