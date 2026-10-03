export interface VideoItem {
  video_id: string;
  title: string;
  chunk_count: number;
  processed_at?: string;
}

export interface SourceItem {
  text: string;
  start_time: number;
  end_time: number;
  start_timestamp: string;
  end_timestamp: string;
  youtube_url: string;
}

export interface AskQuestionResponse {
  video_id: string;
  question: string;
  answer: string;
  sources: SourceItem[];
}

export interface IngestResponse {
  video_id: string;
  title: string;
  status: "success" | "already_processed";
  chunk_count: number;
  message: string;
}

export interface VideoStatusResponse {
  video_id: string;
  title?: string;
  is_indexed: boolean;
  chunk_count?: number;
  processed_at?: string;
}

export interface TranscriptSegment {
  text: string;
  start: number;
  duration: number;
}

export interface TranscriptResponse {
  video_id: string;
  segment_count: number;
  segments: TranscriptSegment[];
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: SourceItem[];
  timestamp: string;
  isLoading?: boolean;
}
