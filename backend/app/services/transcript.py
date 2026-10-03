import os
from typing import List, Dict, Any
import requests
from dotenv import load_dotenv
from youtube_transcript_api import YouTubeTranscriptApi

from app.config import settings

load_dotenv()

API_URL = "https://api.freetranscriptapi.com/v1/transcript"


def _get_transcript_from_api(video_id: str) -> List[Dict[str, Any]]:
    """
    Fetch transcript segments from freetranscriptapi.com
    Returns a list of dicts: [{'text': str, 'start': float, 'duration': float}, ...]
    """
    api_key = settings.TRANSCRIPT_API_KEY or os.getenv("TRANSCRIPT_API_KEY")

    if not api_key:
        raise Exception("TRANSCRIPT_API_KEY is missing from environment / .env")

    response = requests.get(
        API_URL,
        params={
            "video_url": video_id,
            "lang": "en"
        },
        headers={
            "Authorization": f"Bearer {api_key}"
        },
        timeout=30
    )

    response.raise_for_status()
    data = response.json()

    raw_segments = data.get("transcript", [])
    if not raw_segments:
        raise Exception("No transcript segments found for this video from API.")

    segments = []
    for item in raw_segments:
        text = str(item.get("text", "")).strip()
        if not text:
            continue
        start = float(item.get("start", 0.0))
        duration = float(item.get("duration", 0.0))
        segments.append({
            "text": text,
            "start": round(start, 2),
            "duration": round(duration, 2)
        })

    if not segments:
        raise Exception("Transcript API returned empty segments.")

    return segments


def _get_transcript_from_youtube(video_id: str) -> List[Dict[str, Any]]:
    """
    Fallback: fetch transcript segments using youtube-transcript-api.
    Returns a list of dicts: [{'text': str, 'start': float, 'duration': float}, ...]
    """
    api = YouTubeTranscriptApi()
    transcript_list = api.fetch(video_id)

    segments = []
    for item in transcript_list:
        text = str(item.text).strip()
        if not text:
            continue
        start = float(item.start)
        duration = float(item.duration)
        segments.append({
            "text": text,
            "start": round(start, 2),
            "duration": round(duration, 2)
        })

    if not segments:
        raise Exception("youtube-transcript-api returned empty transcript.")

    return segments


def get_transcript(video_id: str) -> List[Dict[str, Any]]:
    """
    Get transcript segments for a YouTube video.
    Tries freetranscriptapi.com first, falls back to youtube-transcript-api.
    Returns:
        List[Dict[str, Any]]: Each item has {'text': str, 'start': float, 'duration': float}
    """
    api_err_msg = ""
    # --- Attempt 1: freetranscriptapi.com ---
    try:
        return _get_transcript_from_api(video_id)
    except Exception as api_error:
        api_err_msg = str(api_error)
        print(f"[Transcript] API failed: {api_error}")
        print("[Transcript] Falling back to youtube-transcript-api...")

    # --- Attempt 2: youtube-transcript-api ---
    try:
        return _get_transcript_from_youtube(video_id)
    except Exception as yt_error:
        raise Exception(
            f"Could not retrieve transcript from either source.\n"
            f"  API error: {api_err_msg}\n"
            f"  YouTube fallback error: {yt_error}"
        )