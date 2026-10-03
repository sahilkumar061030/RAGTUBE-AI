from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


# --- Ingestion & Listing Schemas ---

class IngestRequest(BaseModel):
    url: str = Field(..., description="YouTube URL or video ID", example="https://www.youtube.com/watch?v=E0Hmnixke2g")


class IngestResponse(BaseModel):
    video_id: str
    title: str
    chunk_count: int
    status: str


class VideoListItem(BaseModel):
    video_id: str
    title: str
    chunk_count: int
    processed_at: Optional[str] = None


# --- Q&A / RAG Schemas ---

class SourceChunk(BaseModel):
    text: str = Field(..., description="Text content of the retrieved chunk")
    start_time: float = Field(..., description="Start timestamp in seconds")
    end_time: float = Field(..., description="End timestamp in seconds")
    start_timestamp: str = Field(..., description="Formatted start time, e.g. 01:23")
    end_timestamp: str = Field(..., description="Formatted end time, e.g. 02:45")
    youtube_url: str = Field(..., description="YouTube link jumping to this timestamp")
    chunk_index: int = Field(0, description="Index of chunk in video")


class AskQuestionRequest(BaseModel):
    question: str = Field(..., description="User question about the video", example="What is supervised learning?")
    video_id: Optional[str] = Field(None, description="Optional YouTube 11-char video ID if not in URL path")


class AskQuestionResponse(BaseModel):
    video_id: str
    question: str
    answer: str
    sources: List[SourceChunk] = Field(default_factory=list, description="Relevant context snippets with timestamps")


# --- Status & Transcript Schemas ---

class VideoStatusResponse(BaseModel):
    video_id: str
    title: Optional[str] = None
    is_indexed: bool
    chunk_count: Optional[int] = None
    processed_at: Optional[str] = None


class TranscriptSegment(BaseModel):
    text: str
    start: float
    duration: float


class VideoTranscriptResponse(BaseModel):
    video_id: str
    segment_count: int
    segments: List[TranscriptSegment]


class SuggestedQuestionsResponse(BaseModel):
    video_id: str
    suggested_questions: List[str]


class ErrorDetail(BaseModel):
    detail: str
