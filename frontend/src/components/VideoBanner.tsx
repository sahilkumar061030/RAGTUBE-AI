"use client";

import React, { useState } from "react";
import { PlayIcon, FileTextIcon, ExternalLinkIcon, YoutubeIcon } from "./Icons";

interface VideoBannerProps {
  videoId: string;
  title: string;
  chunkCount: number;
  onOpenTranscript: () => void;
  seekTime?: number | null;
}

export function VideoBanner({
  videoId,
  title,
  chunkCount,
  onOpenTranscript,
  seekTime,
}: VideoBannerProps) {
  const [showPlayer, setShowPlayer] = useState(false);

  // When seekTime changes, if user clicked a timestamp, auto-expand player
  React.useEffect(() => {
    if (seekTime !== null && seekTime !== undefined) {
      setShowPlayer(true);
    }
  }, [seekTime]);

  const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=${
    seekTime !== null && seekTime !== undefined ? "1" : "0"
  }${seekTime ? `&start=${Math.floor(seekTime)}` : ""}`;

  return (
    <div className="glass-panel overflow-hidden border border-[rgba(255,255,255,0.08)] bg-[#0d1322]/90 shadow-xl shadow-black/40">
      {/* Banner Header Info */}
      <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-red-600/20 border border-red-500/30 text-red-400 shrink-0 mt-0.5">
            <YoutubeIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-red-500/15 text-red-400 border border-red-500/25">
                Active Video
              </span>
              <span className="text-xs text-slate-400 font-mono">
                ID: {videoId}
              </span>
              <span className="text-xs text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                {chunkCount} Chunks Indexed
              </span>
            </div>
            <h2 className="text-sm sm:text-base font-bold text-white mt-1 leading-snug line-clamp-2">
              {title}
            </h2>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
          <button
            onClick={() => setShowPlayer((prev) => !prev)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
              showPlayer
                ? "bg-indigo-600/30 text-indigo-300 border-indigo-500/50"
                : "bg-white/5 text-slate-300 border-white/10 hover:bg-white/10 hover:text-white"
            }`}
          >
            <PlayIcon className="w-3.5 h-3.5" />
            <span>{showPlayer ? "Hide Player" : "Watch Video"}</span>
          </button>

          <button
            onClick={onOpenTranscript}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10 hover:text-white transition"
          >
            <FileTextIcon className="w-3.5 h-3.5" />
            <span>Transcript</span>
          </button>

          <a
            href={`https://www.youtube.com/watch?v=${videoId}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center p-2 rounded-lg text-slate-400 hover:text-white bg-white/5 border border-white/10 hover:bg-white/10 transition"
            title="Open on YouTube"
          >
            <ExternalLinkIcon className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Embedded Player if toggled */}
      {showPlayer && (
        <div className="border-t border-[rgba(255,255,255,0.06)] bg-black/60 p-3 sm:p-4">
          <div className="relative aspect-video max-w-2xl mx-auto rounded-xl overflow-hidden shadow-2xl border border-white/10">
            <iframe
              key={`${videoId}-${seekTime || 0}`}
              src={embedUrl}
              title={title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="absolute inset-0 w-full h-full"
            />
          </div>
          {seekTime !== null && seekTime !== undefined && (
            <p className="text-center text-xs text-indigo-300 mt-2 font-mono">
              ▶ Jumped to timestamp: {Math.floor(seekTime / 60)}:
              {String(Math.floor(seekTime % 60)).padStart(2, "0")}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
