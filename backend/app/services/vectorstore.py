from pathlib import Path
from typing import List, Optional
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_core.documents import Document

from app.config import settings

# Module-level singleton instance for the embedding model
_embeddings_instance: Optional[HuggingFaceEmbeddings] = None


def get_embeddings() -> HuggingFaceEmbeddings:
    """
    Singleton getter for HuggingFace embeddings model.
    Loads sentence-transformers/all-MiniLM-L6-v2 once into memory.
    """
    global _embeddings_instance
    if _embeddings_instance is None:
        _embeddings_instance = HuggingFaceEmbeddings(
            model_name="sentence-transformers/all-MiniLM-L6-v2"
        )
    return _embeddings_instance


def get_index_dir(video_id: str) -> Path:
    """Return the directory path for a given video's FAISS index."""
    return settings.INDEXES_DIR / video_id


def is_index_persisted(video_id: str) -> bool:
    """Check if a FAISS index already exists on disk for video_id."""
    index_dir = get_index_dir(video_id)
    return (index_dir / "index.faiss").exists() and (index_dir / "index.pkl").exists()


def build_or_load(video_id: str, chunks: Optional[List[Document]] = None) -> FAISS:
    """
    Build or load a persistent FAISS vector store for a specific video.
    
    - If an index exists in data/indexes/{video_id}/, it is loaded from disk.
    - Otherwise, embeds the provided chunks, builds the index, and saves to disk.
    """
    embeddings = get_embeddings()
    index_dir = get_index_dir(video_id)

    if is_index_persisted(video_id):
        vector_store = FAISS.load_local(
            str(index_dir),
            embeddings,
            allow_dangerous_deserialization=True
        )
        return vector_store

    if not chunks:
        raise ValueError(
            f"No persisted index found for video '{video_id}', and no chunks were provided to build one."
        )

    # Build index from chunks
    vector_store = FAISS.from_documents(chunks, embeddings)

    # Persist to disk
    index_dir.mkdir(parents=True, exist_ok=True)
    vector_store.save_local(str(index_dir))

    return vector_store
