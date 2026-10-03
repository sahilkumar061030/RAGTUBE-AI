"use client";

import React, { useState, useEffect } from "react";
import { TranscriptSegment } from "@/types/api";
import { getTranscript } from "@/lib/api";
import { CloseIcon, LoaderIcon, CopyIcon, CheckIcon, PlayIcon } from "./Icons";

interface TranscriptModalProps {
  videoId: string;
  isOpen: boolean;
  onClose: () => void;
  onSeek: (timeSeconds: number) => void;
}

export function TranscriptModal({
  videoId,
  isOpen,
  onClose,
  onSeek,
}: TranscriptModalProps) {
  const [segments, setSegments] = useState<TranscriptSegment[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !videoId) return;

    let active = true;
    setLoading(true);
    setError(null);

    getTranscript(videoId)
      .then((res) => {
        if (active) {
          setSegments(res.segments || []);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (active) {
          setError(err.message || "Failed to load transcript");
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [isOpen, videoId]);

  if (!isOpen) return null;

  const filtered = segments.filter((s) =>
    s.text.toLowerCase().includes(search.toLowerCase())
  );

  const formatTime = (secs: number) => {
    const s = Math.floor(secs);
    const m = Math.floor(s / 60);
    const rem = s % 60;
    return `${m}:${String(rem).padStart(2, "0")}`;
  };

  const handleCopyAll = () => {
    const fullText = segments
      .map((s) => `[${formatTime(s.start)}] ${s.text}`)
      .join("\n");
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
      <div className="relative w-full max-w-2xl bg-[#0e1422] border border-[rgba(255,255,255,0.12)] rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 border-b border-[rgba(255,255,255,0.08)] flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span>Full Video Transcript</span>
              <span className="text-xs font-mono text-slate-400">
                ({segments.length} segments)
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Click any timestamp to seek the video
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyAll}
              disabled={loading || segments.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition"
            >
              {copied ? (
                <>
                  <CheckIcon className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <CopyIcon className="w-3.5 h-3.5" />
                  <span>Copy All</span>
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition"
            >
              <CloseIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search input */}
        <div className="p-3 border-b border-[rgba(255,255,255,0.06)] bg-[#0a0f1b]">
          <input
            type="text"
            placeholder="Search transcript text..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#141b2d] border border-white/10 focus:border-indigo-500 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none"
          />
        </div>

        {/* Segments List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
              <LoaderIcon className="w-6 h-6 text-indigo-400" />
              <p className="text-xs">Loading transcript segments...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12 text-red-400 text-xs">{error}</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs">
              No transcript matches found.
            </div>
          ) : (
            filtered.map((seg, idx) => (
              <div
                key={idx}
                className="group flex items-start gap-3 p-2 rounded-lg hover:bg-white/5 transition"
              >
                <button
                  onClick={() => {
                    onSeek(seg.start);
                    onClose();
                  }}
                  className="shrink-0 flex items-center gap-1 font-mono text-[11px] font-semibold text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 px-2 py-1 rounded border border-indigo-500/30 transition"
                >
                  <PlayIcon className="w-2.5 h-2.5" />
                  <span>{formatTime(seg.start)}</span>
                </button>
                <p className="text-xs text-slate-300 leading-relaxed group-hover:text-white pt-0.5">
                  {seg.text}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
