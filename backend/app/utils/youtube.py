import re
from typing import Optional
import requests


def extract_video_id(url_or_id: str) -> Optional[str]:
    """
    Extract standard 11-character YouTube video ID from various URL formats
    or validate if the provided string is already a valid video ID.
    
    Supports:
    - https://www.youtube.com/watch?v=VIDEO_ID
    - https://youtu.be/VIDEO_ID
    - https://www.youtube.com/embed/VIDEO_ID
    - https://www.youtube.com/shorts/VIDEO_ID
    - Raw 11-character alphanumeric/dash/underscore ID
    """
    if not url_or_id:
        return None
        
    url_or_id = url_or_id.strip()

    # Direct 11-char ID
    if re.fullmatch(r"[a-zA-Z0-9_-]{11}", url_or_id):
        return url_or_id

    # URL formats
    patterns = [
        r"(?:v=|\/v\/|youtu\.be\/|\/embed\/|\/shorts\/)([a-zA-Z0-9_-]{11})",
        r"[?&]v=([a-zA-Z0-9_-]{11})"
    ]

    for pattern in patterns:
        match = re.search(pattern, url_or_id)
        if match:
            return match.group(1)

    return None


def fetch_video_title(video_id: str) -> Optional[str]:
    """
    Fetch the public YouTube video title using YouTube oEmbed endpoint (no API key required).
    Returns None if fetching fails or video is private/inaccessible.
    """
    try:
        url = f"https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v={video_id}&format=json"
        response = requests.get(url, timeout=5)
        if response.status_code == 200:
            return response.json().get("title")
    except Exception:
        pass
    return None
