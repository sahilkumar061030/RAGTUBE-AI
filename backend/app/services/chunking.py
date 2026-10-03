from typing import List, Dict, Any, Union
from langchain_core.documents import Document


def split_transcript(
    segments_or_text: Union[List[Dict[str, Any]], str],
    video_id: str = "default",
    target_chars: int = 1000,
    overlap_segments: int = 2
) -> List[Document]:
    """
    Build chunks by grouping consecutive segments up to ~1000 characters,
    with ~2 segments of overlap.
    Each chunk is a LangChain Document with metadata:
    - video_id: str
    - start_time: float (seconds)
    - end_time: float (seconds)
    - chunk_index: int
    """
    # Fallback if raw text string is passed
    if isinstance(segments_or_text, str):
        from langchain_text_splitters import RecursiveCharacterTextSplitter
        splitter = RecursiveCharacterTextSplitter(chunk_size=target_chars, chunk_overlap=200)
        raw_docs = splitter.create_documents([segments_or_text])
        for idx, doc in enumerate(raw_docs):
            doc.metadata = {
                "video_id": video_id,
                "start_time": 0.0,
                "end_time": 0.0,
                "chunk_index": idx
            }
        return raw_docs

    segments = segments_or_text
    chunks: List[Document] = []
    if not segments:
        return chunks

    i = 0
    chunk_index = 0
    n = len(segments)

    while i < n:
        current_texts = []
        current_len = 0
        j = i

        while j < n:
            text = segments[j].get("text", "").strip()
            # If adding this segment exceeds target_chars and we have at least 1 segment in the chunk, stop
            added_len = len(text) + (1 if current_texts else 0)
            if current_len + added_len > target_chars and len(current_texts) > 0:
                break
            current_texts.append(text)
            current_len += added_len
            j += 1

        start_time = float(segments[i].get("start", 0.0))
        end_time = float(segments[j - 1].get("start", 0.0)) + float(segments[j - 1].get("duration", 0.0))
        content = " ".join(current_texts)

        doc = Document(
            page_content=content,
            metadata={
                "video_id": video_id,
                "start_time": round(start_time, 2),
                "end_time": round(end_time, 2),
                "chunk_index": chunk_index
            }
        )
        chunks.append(doc)
        chunk_index += 1

        if j >= n:
            break

        # Advance with overlap_segments
        next_i = max(i + 1, j - overlap_segments)
        i = next_i

    return chunks