"use client";

import React, { useState, useEffect } from "react";
import { VideoItem, ChatMessage } from "@/types/api";
import {
  checkBackendHealth,
  getVideos,
  askQuestion,
  getSuggestedQuestions,
} from "@/lib/api";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { VideoBanner } from "@/components/VideoBanner";
import { ChatArea } from "@/components/ChatArea";
import { IngestModal } from "@/components/IngestModal";
import { TranscriptModal } from "@/components/TranscriptModal";
import { YoutubeIcon, PlusIcon, SparklesIcon } from "@/components/Icons";

export default function Home() {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const [isBackendHealthy, setIsBackendHealthy] = useState<boolean | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);
  const [isAnswering, setIsAnswering] = useState(false);
  const [loadingVideos, setLoadingVideos] = useState(true);
  const [seekTime, setSeekTime] = useState<number | null>(null);

  // Modals
  const [isIngestOpen, setIsIngestOpen] = useState(false);
  const [isTranscriptOpen, setIsTranscriptOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Check health and load videos on mount
  useEffect(() => {
    let interval: NodeJS.Timeout;

    const pollHealthAndVideos = async () => {
      const healthy = await checkBackendHealth();
      setIsBackendHealthy(healthy);

      if (healthy) {
        try {
          const list = await getVideos();
          setVideos(list);
          // If no video is selected yet, select the first one
          setSelectedVideoId((curr) => curr || (list.length > 0 ? list[0].video_id : null));
        } catch (e) {
          console.error("Failed to load videos:", e);
        }
      }
      setLoadingVideos(false);
    };

    pollHealthAndVideos();
    interval = setInterval(pollHealthAndVideos, 10000);

    return () => clearInterval(interval);
  }, []);

  // When selected video changes, reset messages and fetch suggestions
  useEffect(() => {
    if (!selectedVideoId) return;

    setMessages([]);
    setSeekTime(null);
    getSuggestedQuestions(selectedVideoId).then((suggestions) => {
      setSuggestedQuestions(suggestions);
    });
  }, [selectedVideoId]);

  const activeVideo = videos.find((v) => v.video_id === selectedVideoId);

  // Handle Q&A submission
  const handleSendMessage = async (question: string) => {
    if (!selectedVideoId || isAnswering) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: question,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsAnswering(true);

    try {
      const response = await askQuestion(selectedVideoId, question);
      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response.answer,
        sources: response.sources,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `⚠️ Failed to get an answer: ${err.message || "An error occurred during generation."}`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsAnswering(false);
    }
  };

  // Video ingestion callback
  const handleIngestSuccess = async (newVideoId: string) => {
    const list = await getVideos();
    setVideos(list);
    setSelectedVideoId(newVideoId);
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#07090e]">
      {/* Top Navbar */}
      <Header
        isBackendHealthy={isBackendHealthy}
        onOpenIngest={() => setIsIngestOpen(true)}
        activeVideoTitle={activeVideo?.title}
      />

      {/* Main Body with Sidebar + Chat Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Responsive Sidebar */}
        <Sidebar
          videos={videos}
          selectedVideoId={selectedVideoId}
          onSelectVideo={(id) => setSelectedVideoId(id)}
          onOpenIngest={() => setIsIngestOpen(true)}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          isLoading={loadingVideos}
        />

        {/* Content Area */}
        <main className="flex-1 flex flex-col h-full overflow-hidden">
          {/* Mobile bar to toggle sidebar if needed */}
          <div className="md:hidden flex items-center justify-between px-4 py-2 border-b border-white/5 bg-[#0a0f1b]">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="text-xs text-indigo-400 font-semibold flex items-center gap-1.5"
            >
              <span>☰ Video Library ({videos.length})</span>
            </button>
            {activeVideo && (
              <span className="text-xs text-slate-400 truncate max-w-[200px]">
                {activeVideo.title}
              </span>
            )}
          </div>

          {activeVideo ? (
            <>
              {/* Active Video Banner & Player */}
              <div className="p-3 sm:p-4 pb-0">
                <VideoBanner
                  videoId={activeVideo.video_id}
                  title={activeVideo.title}
                  chunkCount={activeVideo.chunk_count}
                  onOpenTranscript={() => setIsTranscriptOpen(true)}
                  seekTime={seekTime}
                />
              </div>

              {/* Chat Conversation Area */}
              <ChatArea
                videoId={activeVideo.video_id}
                messages={messages}
                suggestedQuestions={suggestedQuestions}
                isAnswering={isAnswering}
                onSendMessage={handleSendMessage}
                onSeek={(secs) => setSeekTime(secs)}
                onOpenIngest={() => setIsIngestOpen(true)}
              />
            </>
          ) : (
            /* No video selected hero state */
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-red-600 via-rose-500 to-indigo-600 flex items-center justify-center shadow-2xl shadow-red-500/20 mb-6">
                <YoutubeIcon className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Welcome to <span className="gradient-text-ai">VideoMind</span>
              </h1>
              <p className="text-sm text-slate-400 max-w-md mt-2">
                Ingest any YouTube video to automatically extract transcripts,
                generate vector embeddings, and ask questions with exact timestamp
                sources.
              </p>
              <button
                onClick={() => setIsIngestOpen(true)}
                className="mt-6 flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-red-600 to-indigo-600 hover:from-red-500 hover:to-indigo-500 shadow-xl shadow-indigo-600/30 active:scale-95 transition"
              >
                <PlusIcon className="w-4 h-4" />
                <span>Ingest a YouTube Video</span>
              </button>
            </div>
          )}
        </main>
      </div>

      {/* Ingest Video Modal */}
      <IngestModal
        isOpen={isIngestOpen}
        onClose={() => setIsIngestOpen(false)}
        onSuccess={handleIngestSuccess}
      />

      {/* Transcript Modal */}
      {selectedVideoId && (
        <TranscriptModal
          videoId={selectedVideoId}
          isOpen={isTranscriptOpen}
          onClose={() => setIsTranscriptOpen(false)}
          onSeek={(secs) => setSeekTime(secs)}
        />
      )}
    </div>
  );
}
