import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Any, List, Optional

from app.config import settings
from app.services.vectorstore import is_index_persisted


def get_metadata_file_path() -> Path:
    """Return path to videos.json metadata file."""
    return settings.DATA_DIR / "videos.json"


def load_metadata_store() -> Dict[str, Dict[str, Any]]:
    """Load metadata dictionary from data/videos.json."""
    file_path = get_metadata_file_path()
    if not file_path.exists():
        return {}
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {}


def save_video_metadata(
    video_id: str,
    title: Optional[str] = None,
    chunk_count: int = 0
) -> Dict[str, Any]:
    """Record metadata for an ingested video and persist to videos.json."""
    data = load_metadata_store()
    now_iso = datetime.now(timezone.utc).isoformat()
    record = {
        "video_id": video_id,
        "title": title or f"YouTube Video ({video_id})",
        "chunk_count": chunk_count,
        "processed_at": now_iso
    }
    data[video_id] = record

    file_path = get_metadata_file_path()
    file_path.parent.mkdir(parents=True, exist_ok=True)
    with open(file_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)

    return record


def list_processed_videos() -> List[Dict[str, Any]]:
    """
    List all processed videos cross-checked against disk indexes.
    Only videos that actually have their FAISS index present are returned.
    """
    metadata = load_metadata_store()
    indexes_dir = settings.INDEXES_DIR
    valid_videos = []

    if indexes_dir.exists():
        for path in indexes_dir.iterdir():
            if path.is_dir() and is_index_persisted(path.name):
                vid = path.name
                meta = metadata.get(vid, {
                    "video_id": vid,
                    "title": f"YouTube Video ({vid})",
                    "chunk_count": 0,
                    "processed_at": None
                })
                valid_videos.append(meta)

    # Sort most recently processed first if processed_at is available
    valid_videos.sort(key=lambda x: x.get("processed_at") or "", reverse=True)
    return valid_videos
