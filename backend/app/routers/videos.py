from fastapi import APIRouter, HTTPException, status, Path as PathParam
from typing import List, Optional

from app.utils.youtube import extract_video_id, fetch_video_title
from app.services.transcript import get_transcript
from app.services.chunking import split_transcript
from app.services.vectorstore import build_or_load, is_index_persisted
from app.services.metadata import save_video_metadata, list_processed_videos, load_metadata_store
from app.services.retrieval import create_retriever
from app.services.rag import create_rag_chain, generate_suggested_questions

from app.schemas.video import (
    IngestRequest,
    IngestResponse,
    VideoListItem,
    AskQuestionRequest,
    AskQuestionResponse,
    VideoStatusResponse,
    TranscriptSegment,
    VideoTranscriptResponse,
    SuggestedQuestionsResponse,
    ErrorDetail,
)

router = APIRouter()


# ---------------------------------------------------------
# 1. Video Ingestion & Listing
# ---------------------------------------------------------

@router.post(
    "",
    response_model=IngestResponse,
    status_code=status.HTTP_200_OK,
    summary="Ingest a YouTube video",
    responses={
        400: {"model": ErrorDetail, "description": "Invalid URL or captions unavailable"},
        500: {"model": ErrorDetail, "description": "Internal server error"},
    },
)
def ingest_video(request: IngestRequest):
    """
    Process a YouTube video:
    1. Extract 11-char video ID.
    2. Check if already persisted on disk (returns cached record immediately).
    3. Extract transcript (via API or YouTube fallback).
    4. Chunk text with start/end timestamps.
    5. Build & persist FAISS index on disk.
    6. Save metadata to data/videos.json.
    """
    video_id = extract_video_id(request.url)
    if not video_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Invalid YouTube URL. Supported formats: "
                "youtube.com/watch?v=ID, youtu.be/ID, youtube.com/shorts/ID, "
                "or a raw 11-character video ID."
            ),
        )

    # If already indexed, avoid re-computing
    if is_index_persisted(video_id):
        metadata = load_metadata_store().get(video_id, {})
        title = metadata.get("title") or fetch_video_title(video_id) or f"YouTube Video ({video_id})"
        vs = build_or_load(video_id)
        chunk_count = len(vs.docstore._dict) if hasattr(vs, "docstore") else metadata.get("chunk_count", 0)
        meta = save_video_metadata(video_id, title=title, chunk_count=chunk_count)
        return IngestResponse(
            video_id=video_id,
            title=meta["title"],
            chunk_count=chunk_count,
            status="already_processed",
        )

    # Fetch title
    title = fetch_video_title(video_id)

    # Extract transcript
    try:
        segments = get_transcript(video_id)
    except Exception as e:
        msg = str(e)
        if "private" in msg.lower() or "unavailable" in msg.lower():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"This video is private or unavailable: {msg}",
            )
        if "no transcript" in msg.lower() or "could not retrieve" in msg.lower():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"No captions/transcript available for this video: {msg}",
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to fetch transcript: {msg}",
        )

    # Chunk with timestamps
    chunks = split_transcript(segments, video_id=video_id)

    # Embed and persist to FAISS index
    try:
        build_or_load(video_id, chunks)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to build vector index: {str(e)}",
        )

    # Persist metadata
    meta = save_video_metadata(video_id, title=title, chunk_count=len(chunks))

    return IngestResponse(
        video_id=video_id,
        title=meta["title"],
        chunk_count=len(chunks),
        status="success",
    )


@router.get(
    "",
    response_model=List[VideoListItem],
    summary="List all processed videos",
)
def list_videos():
    """Return all videos with persisted FAISS indexes on disk."""
    videos = list_processed_videos()
    return [
        VideoListItem(
            video_id=v["video_id"],
            title=v["title"],
            chunk_count=v.get("chunk_count", 0),
            processed_at=v.get("processed_at"),
        )
        for v in videos
    ]


# ---------------------------------------------------------
# 2. Q&A / RAG Query Endpoints
# ---------------------------------------------------------

@router.post(
    "/{video_id}/ask",
    response_model=AskQuestionResponse,
    status_code=status.HTTP_200_OK,
    summary="Ask a question about a specific video",
    responses={
        400: {"model": ErrorDetail, "description": "Invalid question"},
        404: {"model": ErrorDetail, "description": "Video not indexed"},
        500: {"model": ErrorDetail, "description": "LLM generation failure"},
    },
)
def ask_video_question(
    video_id: str = PathParam(..., description="YouTube 11-char video ID"),
    request: AskQuestionRequest = ...,
):
    """
    Ask a question about an ingested video.
    Retrieves top chunks from the persistent FAISS index and synthesizes
    an answer using Gemini with timestamps and sources.
    """
    clean_question = request.question.strip()
    if not clean_question:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Question cannot be empty or whitespace.",
        )

    if not is_index_persisted(video_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=(
                f"Video '{video_id}' has not been processed yet. "
                f"Please ingest it first using POST /api/videos."
            ),
        )

    try:
        vector_store = build_or_load(video_id)
        retriever = create_retriever(vector_store)
        rag_chain = create_rag_chain(retriever, video_id=video_id)
        result = rag_chain(clean_question)

        return AskQuestionResponse(
            video_id=video_id,
            question=clean_question,
            answer=result["answer"],
            sources=result["sources"],
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"RAG processing failed: {str(e)}",
        )


@router.post(
    "/ask",
    response_model=AskQuestionResponse,
    status_code=status.HTTP_200_OK,
    summary="Ask a question (video_id in body)",
    responses={
        400: {"model": ErrorDetail, "description": "Missing video_id or question"},
        404: {"model": ErrorDetail, "description": "Video not indexed"},
        500: {"model": ErrorDetail, "description": "LLM generation failure"},
    },
)
def ask_question_body(request: AskQuestionRequest):
    """
    Alternative ask endpoint where video_id is passed in the JSON request body.
    """
    if not request.video_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Field 'video_id' is required in request body when not in URL path.",
        )
    return ask_video_question(video_id=request.video_id, request=request)


# ---------------------------------------------------------
# 3. Video Metadata, Status & Transcript Endpoints
# ---------------------------------------------------------

@router.get(
    "/{video_id}/status",
    response_model=VideoStatusResponse,
    summary="Get indexing status of a video",
)
def get_video_status(video_id: str = PathParam(..., description="YouTube 11-char video ID")):
    """Check if video index exists, chunk count, and metadata."""
    indexed = is_index_persisted(video_id)
    chunk_count = None
    title = None
    processed_at = None

    if indexed:
        metadata = load_metadata_store().get(video_id, {})
        title = metadata.get("title")
        processed_at = metadata.get("processed_at")
        vs = build_or_load(video_id)
        if vs and hasattr(vs, "docstore"):
            chunk_count = len(vs.docstore._dict)

    return VideoStatusResponse(
        video_id=video_id,
        title=title,
        is_indexed=indexed,
        chunk_count=chunk_count,
        processed_at=processed_at,
    )


@router.get(
    "/{video_id}/transcript",
    response_model=VideoTranscriptResponse,
    summary="Get raw transcript segments for a video",
)
def get_video_transcript(video_id: str = PathParam(..., description="YouTube 11-char video ID")):
    """Retrieve raw transcript segments with timestamps."""
    try:
        segments = get_transcript(video_id)
        return VideoTranscriptResponse(
            video_id=video_id,
            segment_count=len(segments),
            segments=[
                TranscriptSegment(
                    text=s["text"],
                    start=s["start"],
                    duration=s["duration"]
                )
                for s in segments
            ],
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to fetch transcript: {str(e)}",
        )


@router.get(
    "/{video_id}/suggested-questions",
    response_model=SuggestedQuestionsResponse,
    summary="Get suggested questions for an ingested video",
)
def get_suggested_questions(video_id: str = PathParam(..., description="YouTube 11-char video ID")):
    """Generate 3 smart suggested questions based on indexed content."""
    if not is_index_persisted(video_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Video '{video_id}' is not indexed. Please ingest it first.",
        )

    vs = build_or_load(video_id)
    retriever = create_retriever(vs)
    questions = generate_suggested_questions(retriever, video_id=video_id)

    return SuggestedQuestionsResponse(
        video_id=video_id,
        suggested_questions=questions,
    )
