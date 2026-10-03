# VideoMind FastAPI Backend

VideoMind is an AI-powered YouTube video Q&A service utilizing Retrieval-Augmented Generation (RAG).

## Features
- **Transcript Extraction**: Fetches YouTube video transcripts via FreeTranscriptAPI with automatic fallback to `youtube-transcript-api`.
- **Text Chunking**: Recursive character splitting with timestamp preservation and segment overlap.
- **Persistent Vector Store**: Uses HuggingFace Sentence Transformers (`all-MiniLM-L6-v2`) and FAISS with disk persistence and in-memory caching.
- **RAG Pipeline**: Powered by Google Gemini (`gemini-2.5-flash`), returning structured point-wise answers and timestamped YouTube source citations.
- **Fast Execution & Caching**: Re-querying an indexed video bypasses re-fetching/re-embedding.
- **Suggested Questions**: Contextually generates relevant viewer questions for any ingested video.

---

## Directory Structure

```
backend/
├── app/
│   ├── config.py           # Configuration & environment variables
│   ├── main.py             # FastAPI entry point & CORS configuration
│   ├── routers/
│   │   ├── __init__.py     # Router exports
│   │   ├── videos.py       # Unified video ingestion & Q&A endpoints
│   │   └── video.py        # Alias / backwards-compatibility export
│   ├── schemas/
│   │   ├── __init__.py     # Schema exports
│   │   └── video.py        # Comprehensive Pydantic request/response schemas
│   ├── services/
│   │   ├── __init__.py     # Service exports
│   │   ├── transcript.py   # Transcript fetching & fallback logic
│   │   ├── chunking.py     # Timestamp-preserving text splitting
│   │   ├── vectorstore.py  # Persistent FAISS store & singleton embeddings
│   │   ├── metadata.py     # Metadata persistence (data/videos.json)
│   │   ├── retrieval.py    # Vector retriever setup
│   │   └── rag.py          # Gemini RAG chain & suggested question generator
│   └── utils/
│       ├── __init__.py
│       └── youtube.py      # YouTube URL parser & oEmbed title fetcher
├── data/
│   ├── indexes/            # Persisted FAISS vector indexes (keyed by video_id)
│   └── videos.json         # Persisted video metadata store
├── tests/
│   ├── test_step3_benchmark.py
│   ├── test_step4_ingest.py
│   └── test_step5_qa.py    # Comprehensive RAG Q&A test suite
├── requirements.txt        # Pinned Python dependencies
└── run.py                  # Convenience server starter script
```

---

## API Endpoints

All video endpoints are routed under `/api/videos`.

### 1. Health & Root
- `GET /` - Root status & info.
- `GET /api/health` - Health check endpoint (`{"status": "ok"}`).
- `GET /docs` - Interactive Swagger API documentation.

### 2. Video Ingestion & Listing
- `POST /api/videos`
  - Body: `{"url": "https://www.youtube.com/watch?v=VIDEO_ID"}`
  - Ingests video, extracts transcript, chunks text, creates FAISS index, and persists metadata.
  - If video was already processed, immediately returns `already_processed` without duplicate computation.
- `GET /api/videos`
  - Returns a list of all processed videos with titles, chunk counts, and processing timestamps.

### 3. RAG Q&A & Sources
- `POST /api/videos/{video_id}/ask` (or `POST /api/videos/ask`)
  - Body: `{"question": "What is supervised learning?"}` (plus `"video_id"` if using `/api/videos/ask`)
  - Performs vector similarity search and answers using Gemini.
  - Returns:
    - `answer`: Point-wise, structured answer grounded strictly in video context.
    - `sources`: List of retrieved chunks with `start_timestamp`, `end_timestamp`, text, and direct clickable `youtube_url` jumping to the timestamp.
  - Hallucination guardrail: Returns `"I don't know based on the provided transcript."` if answer is not in context.

### 4. Video Details & Suggestions
- `GET /api/videos/{video_id}/status`
  - Returns whether video is indexed, title, and chunk count.
- `GET /api/videos/{video_id}/transcript`
  - Returns raw transcript segments with start and duration timings.
- `GET /api/videos/{video_id}/suggested-questions`
  - Returns 3 smart suggested questions generated from the video's content.

---

## Running the Server

From the `backend` directory:

```bash
# Using run.py
python run.py

# Or directly with uvicorn
uvicorn app.main:app --reload --port 8000
```

---

## Running Tests

From the `Youtube_RAG_Chatbot` root or `backend` directory:

```bash
python backend/tests/test_step3_benchmark.py
python backend/tests/test_step4_ingest.py
python backend/tests/test_step5_qa.py
```
