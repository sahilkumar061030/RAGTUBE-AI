import {
  VideoItem,
  IngestResponse,
  AskQuestionResponse,
  VideoStatusResponse,
  TranscriptResponse,
} from "@/types/api";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function checkBackendHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/api/health`, {
      method: "GET",
      cache: "no-store",
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function getVideos(): Promise<VideoItem[]> {
  const res = await fetch(`${API_BASE}/api/videos`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Failed to fetch videos" }));
    throw new Error(err.detail || "Failed to fetch videos");
  }
  return res.json();
}

export async function ingestVideo(url: string): Promise<IngestResponse> {
  const res = await fetch(`${API_BASE}/api/videos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Ingestion failed" }));
    throw new Error(err.detail || "Ingestion failed");
  }
  return res.json();
}

export async function getVideoStatus(videoId: string): Promise<VideoStatusResponse> {
  const res = await fetch(`${API_BASE}/api/videos/${encodeURIComponent(videoId)}/status`, {
    method: "GET",
    cache: "no-store",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Failed to fetch video status" }));
    throw new Error(err.detail || "Failed to fetch video status");
  }
  return res.json();
}

export async function askQuestion(
  videoId: string,
  question: string
): Promise<AskQuestionResponse> {
  const res = await fetch(`${API_BASE}/api/videos/${encodeURIComponent(videoId)}/ask`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Failed to answer question" }));
    throw new Error(err.detail || "Failed to answer question");
  }
  return res.json();
}

export async function getSuggestedQuestions(videoId: string): Promise<string[]> {
  try {
    const res = await fetch(
      `${API_BASE}/api/videos/${encodeURIComponent(videoId)}/suggested-questions`,
      {
        method: "GET",
        cache: "no-store",
      }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data.suggested_questions || [];
  } catch {
    return [];
  }
}

export async function getTranscript(videoId: string): Promise<TranscriptResponse> {
  const res = await fetch(
    `${API_BASE}/api/videos/${encodeURIComponent(videoId)}/transcript`,
    {
      method: "GET",
      cache: "no-store",
    }
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Failed to fetch transcript" }));
    throw new Error(err.detail || "Failed to fetch transcript");
  }
  return res.json();
}
