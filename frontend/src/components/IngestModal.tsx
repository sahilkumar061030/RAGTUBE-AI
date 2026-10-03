"use client";

import React, { useState } from "react";
import { ingestVideo } from "@/lib/api";
import { YoutubeIcon, CloseIcon, LoaderIcon, CheckIcon, SparklesIcon } from "./Icons";

interface IngestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (videoId: string) => void;
}

const SAMPLE_VIDEOS = [
  {
    title: "Machine Learning Explained (17 min)",
    url: "https://www.youtube.com/watch?v=E0Hmnixke2g",
    videoId: "E0Hmnixke2g",
  },
  {
    title: "Neural Networks (3Blue1Brown)",
    url: "https://www.youtube.com/watch?v=aircAruvnKk",
    videoId: "aircAruvnKk",
  },
];

export function IngestModal({ isOpen, onClose, onSuccess }: IngestModalProps) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stage, setStage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (targetUrl?: string) => {
    const inputUrl = targetUrl || url.trim();
    if (!inputUrl) {
      setError("Please paste a YouTube video URL");
      return;
    }

    setLoading(true);
    setError(null);
    setStage("Connecting to YouTube & fetching transcript...");

    try {
      // Simulate stages for smooth UX
      const timer = setTimeout(() => {
        setStage("Chunking text & computing SentenceTransformer embeddings...");
      }, 1500);

      const res = await ingestVideo(inputUrl);
      clearTimeout(timer);

      setStage("Success! Building persistent FAISS index...");
      setTimeout(() => {
        setLoading(false);
        setUrl("");
        setStage(null);
        onSuccess(res.video_id);
        onClose();
      }, 600);
    } catch (err: any) {
      setLoading(false);
      setStage(null);
      setError(err.message || "Failed to process video. Verify URL or captions.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
      <div className="relative w-full max-w-lg bg-[#0e1424] border border-[rgba(255,255,255,0.12)] rounded-2xl shadow-2xl overflow-hidden p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-red-600/20 text-red-500 border border-red-500/30">
              <YoutubeIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Ingest YouTube Video</h2>
              <p className="text-xs text-slate-400">
                Extracts transcript, chunks timestamps, and indexes in FAISS
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Input */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300">
            YouTube Video URL or Video ID
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="https://www.youtube.com/watch?v=... or youtu.be/..."
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                setError(null);
              }}
              disabled={loading}
              className="w-full bg-[#131b2e] border border-[rgba(255,255,255,0.12)] focus:border-indigo-500 rounded-xl px-4 py-3 text-xs text-white placeholder:text-slate-500 focus:outline-none transition"
            />
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-start gap-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Loading stage */}
        {loading && stage && (
          <div className="p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs flex items-center gap-3 animate-pulse">
            <LoaderIcon className="w-4 h-4 text-indigo-400 shrink-0" />
            <span>{stage}</span>
          </div>
        )}

        {/* Sample Videos to try */}
        <div className="space-y-2 pt-1">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Or try an instant sample:
          </span>
          <div className="grid grid-cols-1 gap-2">
            {SAMPLE_VIDEOS.map((sample) => (
              <button
                key={sample.videoId}
                type="button"
                disabled={loading}
                onClick={() => {
                  setUrl(sample.url);
                  handleSubmit(sample.url);
                }}
                className="flex items-center justify-between p-2.5 rounded-xl bg-[#141d33] hover:bg-[#1a2542] border border-white/5 hover:border-indigo-500/40 text-left transition group"
              >
                <div className="flex items-center gap-2.5">
                  <SparklesIcon className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition" />
                  <span className="text-xs font-medium text-slate-200 group-hover:text-white">
                    {sample.title}
                  </span>
                </div>
                <span className="text-[10px] text-indigo-400 font-mono">1-Click</span>
              </button>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-2 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => handleSubmit()}
            disabled={loading || !url.trim()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-red-600 to-indigo-600 hover:from-red-500 hover:to-indigo-500 shadow-lg shadow-indigo-600/25 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {loading ? (
              <>
                <LoaderIcon className="w-4 h-4" />
                <span>Processing Video...</span>
              </>
            ) : (
              <>
                <CheckIcon className="w-4 h-4" />
                <span>Ingest & Index</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
