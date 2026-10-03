import os
from typing import List, Dict, Any, Optional
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import PromptTemplate

from app.config import settings

load_dotenv()


def format_seconds(seconds: float) -> str:
    """Format seconds into HH:MM:SS or MM:SS."""
    secs = max(0, int(seconds))
    hours = secs // 3600
    minutes = (secs % 3600) // 60
    rem_secs = secs % 60
    if hours > 0:
        return f"{hours:02d}:{minutes:02d}:{rem_secs:02d}"
    return f"{minutes:02d}:{rem_secs:02d}"


def create_rag_chain(retriever, video_id: Optional[str] = None):
    """
    Build a RAG answering callable using Gemini and the provided vector retriever.
    Returns a function that takes a question string and returns:
    {
        "answer": str,
        "sources": List[Dict[str, Any]]
    }
    """
    api_key = settings.GOOGLE_API_KEY or os.getenv("GOOGLE_API_KEY")
    model_name = settings.GEMINI_MODEL or os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

    llm = ChatGoogleGenerativeAI(
        model=model_name,
        google_api_key=api_key,
    )

    prompt = PromptTemplate(
        template="""You are a helpful assistant answering questions about a YouTube video.

Answer the question using ONLY the provided context.

If the answer cannot be found in the context, say:
"I don't know based on the provided transcript."

RESPONSE FORMAT:
- Always answer point-wise.
- Use numbered points for main concepts.
- Use bullet points for details under each concept.
- Do not use Markdown headings such as ###.
- Do not write one long paragraph.
- Keep the answer clear, concise, and easy to read.
- Maintain proper spaces between words and sentences.
- Do not repeat the question.
- Do not add information that is not present in the context.

Example format:

1. Concept Name
   - Point one.
   - Point two.
   - Point three.

2. Another Concept
   - Point one.
   - Point two.
   - Point three.

Context:
{context}

Question:
{question}

Answer:
""",
        input_variables=["context", "question"]
    )

    def answer_question(question: str) -> Dict[str, Any]:
        # Retrieve relevant chunks
        docs = retriever.invoke(question)

        # Build context
        context = "\n\n".join(doc.page_content for doc in docs)

        # Generate prompt and invoke Gemini
        final_prompt = prompt.invoke({
            "context": context,
            "question": question
        })
        response = llm.invoke(final_prompt)

        # Extract answer string
        content = response.content
        if isinstance(content, list):
            answer_text = "\n".join(
                part.get("text", "") for part in content if isinstance(part, dict)
            )
        else:
            answer_text = str(content)

        # Build sources with timestamps and clickable YouTube URLs
        sources = []
        for doc in docs:
            meta = doc.metadata or {}
            vid = meta.get("video_id") or video_id or ""
            start_time = float(meta.get("start_time", 0.0))
            end_time = float(meta.get("end_time", 0.0))
            yt_url = (
                f"https://www.youtube.com/watch?v={vid}&t={int(start_time)}s"
                if vid
                else ""
            )
            sources.append({
                "text": doc.page_content,
                "start_time": start_time,
                "end_time": end_time,
                "start_timestamp": format_seconds(start_time),
                "end_timestamp": format_seconds(end_time),
                "youtube_url": yt_url,
                "chunk_index": meta.get("chunk_index", 0),
            })

        return {
            "answer": answer_text.strip(),
            "sources": sources,
        }

    return answer_question


def generate_suggested_questions(retriever, video_id: Optional[str] = None) -> List[str]:
    """
    Generate 3 suggested questions based on the video's overview content.
    Falls back to high-yield general questions on failure.
    """
    default_questions = [
        "What is the main topic or objective of this video?",
        "What are the key concepts and explanations discussed?",
        "What are the final conclusions or recommendations?",
    ]

    try:
        api_key = settings.GOOGLE_API_KEY or os.getenv("GOOGLE_API_KEY")
        model_name = settings.GEMINI_MODEL or os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
        llm = ChatGoogleGenerativeAI(
            model=model_name,
            google_api_key=api_key,
        )

        overview_docs = retriever.invoke("introduction overview summary main points")
        context = "\n".join([d.page_content for d in overview_docs[:3]])

        prompt = (
            f"Based on the following video transcript excerpt, generate exactly 3 interesting "
            f"and specific questions a viewer might ask about this video.\n"
            f"Output only the 3 questions, each on a new line without numbers or prefixes.\n\n"
            f"Transcript excerpt:\n{context}"
        )

        res = llm.invoke(prompt)
        text = res.content if isinstance(res.content, str) else ""
        lines = [line.strip().lstrip("1234567890.-• ") for line in text.split("\n") if line.strip()]
        questions = [q for q in lines if q and q.endswith("?")]

        if len(questions) >= 3:
            return questions[:3]
        return default_questions
    except Exception:
        return default_questions