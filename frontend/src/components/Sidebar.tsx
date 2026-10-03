"use client";

import React, { useState } from "react";
import { VideoItem } from "@/types/api";
import { LayersIcon, PlusIcon, CloseIcon } from "./Icons";

interface SidebarProps {
  videos: VideoItem[];
  selectedVideoId: string | null;
  onSelectVideo: (videoId: string) => void;
  onOpenIngest: () => void;
  isOpen: boolean;
  onClose: () => void;
  isLoading: boolean;
}

export function Sidebar({
  videos,
  selectedVideoId,
  onSelectVideo,
  onOpenIngest,
  isOpen,
  onClose,
  isLoading,
}: SidebarProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredVideos = videos.filter((v) =>
    (v.title || v.video_id).toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
        />
      )}

      {/* Sidebar Panel */}
      <aside
        className={`fixed md:static top-0 bottom-0 left-0 z-40 w-72 lg:w-80 flex flex-col bg-[#0b0f19] border-r border-[rgba(255,255,255,0.07)] transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-[rgba(255,255,255,0.06)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LayersIcon className="w-4 h-4 text-indigo-400" />
            <h2 className="text-sm font-bold text-white tracking-wide uppercase">
              Video Library
            </h2>
            <span className="text-[11px] font-semibold text-slate-400 bg-white/5 px-2 py-0.5 rounded-full border border-white/5">
              {videos.length}
            </span>
          </div>
          <button
            onClick={onClose}
            className="md:hidden text-slate-400 hover:text-white p-1 rounded-lg"
          >
            <CloseIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Search & Ingest bar */}
        <div className="p-3 border-b border-[rgba(255,255,255,0.05)] space-y-2">
          <input
            type="text"
            placeholder="Search indexed videos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#131b2e] border border-[rgba(255,255,255,0.08)] focus:border-indigo-500 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none transition"
          />

          <button
            onClick={onOpenIngest}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold text-white bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 transition"
          >
            <PlusIcon className="w-3.5 h-3.5" />
            <span>Ingest New Video</span>
          </button>
        </div>

        {/* Video List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
          {isLoading && videos.length === 0 ? (
            <div className="space-y-3 py-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="animate-pulse bg-white/5 rounded-xl h-20 border border-white/5"
                />
              ))}
            </div>
          ) : filteredVideos.length === 0 ? (
            <div className="text-center py-10 px-4">
              <p className="text-xs text-slate-400 font-medium">
                {searchTerm ? "No videos match your search." : "No videos indexed yet."}
              </p>
              <button
                onClick={onOpenIngest}
                className="mt-3 text-xs text-indigo-400 hover:text-indigo-300 underline font-medium"
              >
                Add your first YouTube video
              </button>
            </div>
          ) : (
            filteredVideos.map((video) => {
              const isSelected = video.video_id === selectedVideoId;
              const thumbUrl = `https://img.youtube.com/vi/${video.video_id}/mqdefault.jpg`;

              return (
                <div
                  key={video.video_id}
                  onClick={() => {
                    onSelectVideo(video.video_id);
                    onClose();
                  }}
                  className={`group relative flex gap-3 p-2.5 rounded-xl cursor-pointer transition-all border ${
                    isSelected
                      ? "bg-indigo-950/40 border-indigo-500/60 shadow-lg shadow-indigo-950/50"
                      : "bg-[#111827]/60 border-[rgba(255,255,255,0.05)] hover:border-[rgba(255,255,255,0.15)] hover:bg-[#151e30]"
                  }`}
                >
                  {/* Thumbnail */}
                  <div className="relative w-20 h-14 rounded-lg overflow-hidden shrink-0 bg-black/40 border border-white/10">
                    <img
                      src={thumbUrl}
                      alt={video.title || "Video thumbnail"}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src =
                          "data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><rect fill=%22%23222%22 width=%22100%22 height=%22100%22/><text fill=%22%23777%22 x=%2250%%22 y=%2250%%22 font-size=%2212%22 text-anchor=%22middle%22 dy=%22.3em%22>Video</text></svg>";
                      }}
                    />
                    {isSelected && (
                      <span className="absolute top-1 left-1 w-2 h-2 rounded-full bg-indigo-400 shadow-[0_0_6px_#818cf8]" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <h3
                      className={`text-xs font-semibold leading-tight line-clamp-2 ${
                        isSelected ? "text-indigo-200" : "text-slate-200 group-hover:text-white"
                      }`}
                      title={video.title}
                    >
                      {video.title || video.video_id}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-medium text-slate-400 bg-white/5 px-1.5 py-0.5 rounded border border-white/5">
                        {video.chunk_count} chunks
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {video.video_id}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-[rgba(255,255,255,0.06)] bg-[#090d16] text-[11px] text-slate-500 flex items-center justify-between">
          <span>FAISS Vector Index</span>
          <span className="text-emerald-400 font-mono text-[10px]">Disk Cached</span>
        </div>
      </aside>
    </>
  );
}
