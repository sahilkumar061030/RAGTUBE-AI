# 🎬 RAGTube AI

> **Talk to Any YouTube Video — High-Precision Retrieval-Augmented Generation (RAG) with Timestamp-Synchronized Citations.**

RAGTube AI is a production-grade full-stack AI platform that transforms passive video watching into an interactive knowledge search engine. Simply paste any YouTube URL, and the system extracts transcripts, chunks temporal text, indexes dense embeddings via FAISS, and enables grounded Q&A with Google Gemini 2.5 Flash — complete with instant video jump-to timestamps.

---

## ✨ Key Features

- **⚡ End-to-End Semantic Ingestion**: Paste any YouTube link to fetch and parse captions with sub-second processing.
- **🧠 Intelligent Sliding-Window Chunking**: Context-aware temporal chunking preserves sentence continuity and timestamps.
- **🔍 Sub-200ms Vector Similarity Search**: Local **FAISS** vector store powered by HuggingFace `all-MiniLM-L6-v2` embeddings (384 dimensions).
- **⏱️ Timestamped Citations**: Every generated answer includes direct, clickable video timestamps that immediately synchronize playback.
- **🛡️ Zero-Hallucination Guardrails**: Prompts are strictly grounded on retrieved video passages.
- **🚀 Unified Full-Stack Workflow**: Run both FastAPI backend and Next.js frontend concurrently with a single command (`npm run dev`).

---

## 🏗️ Architecture

```
                                  +-------------------+
                                  |   YouTube Video   |
                                  +---------+---------+
                                            |
                                            v
                                 [ YouTube Transcript ]
                                            |
                                            v
                                 [ Semantic Chunking ]
                                            |
                                            v
     +--------------------+      +--------------------+
     | HuggingFace MiniLM | ---> |    FAISS Vector    |
     |     Embeddings     |      |       Store        |
     +--------------------+      +---------+----------+
                                           |  Similarity
                             User Query    |  Search
                                  |        v
                                  +---> [ Top-K Context ]
                                            |
                                            v
                                  [ Google Gemini 2.5 ]
                                            |
                                            v
                               +-------------------------+
                               | Timestamp-Cited Answers |
                               +-------------------------+
```

---

## 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | Next.js 14 (App Router), React, TypeScript, Tailwind CSS, Lucide Icons |
| **Backend** | Python 3.11+, FastAPI, Pydantic, Uvicorn |
| **AI / RAG** | LangChain, FAISS Vector Index, HuggingFace `all-MiniLM-L6-v2` |
| **LLM** | Google Gemini 2.5 Flash |
| **Data Ingestion** | YouTube Transcript API |

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v18+)
- **Python** (v3.10+)
- **Google Gemini API Key** ([Get one here](https://aistudio.google.com/))

---

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone https://github.com/sahilkumar061030/RAGTUBE-AI.git
   cd RAGTUBE-AI
   ```

2. **Configure Environment Variables**
   Create a `.env` file in the root directory:
   ```env
   GOOGLE_API_KEY=your_gemini_api_key_here
   ```

3. **Install Dependencies**
   ```bash
   # Root & Frontend dependencies
   npm install

   # Backend Python dependencies
   cd backend
   pip install -r requirements.txt
   cd ..
   ```

4. **Run the Application (Single Command)**
   ```bash
   npm run dev
   ```

   - **Frontend UI:** `http://localhost:3000`
   - **Backend API:** `http://localhost:8000`
   - **Interactive API Docs (Swagger):** `http://localhost:8000/docs`

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/videos/ingest` | Process YouTube video, chunk transcript & build FAISS index |
| `POST` | `/api/videos/query` | Perform vector retrieval and return grounded Gemini response |
| `GET` | `/api/videos/list` | List all indexed videos |
| `GET` | `/api/videos/{video_id}/transcript` | Retrieve parsed transcript |
| `DELETE` | `/api/videos/{video_id}` | Delete video vector index |

---

## 📄 License
This project is open-source under the MIT License.
