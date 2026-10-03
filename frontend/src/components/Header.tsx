"use client";

import React from "react";
import { YoutubeIcon, ExternalLinkIcon, PlusIcon } from "./Icons";

interface HeaderProps {
  isBackendHealthy: boolean | null;
  onOpenIngest: () => void;
  activeVideoTitle?: string;
}

export function Header({
  isBackendHealthy,
  onOpenIngest,
  activeVideoTitle,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-[rgba(255,255,255,0.08)] bg-[#07090e]/80 backdrop-blur-md px-4 sm:px-6 py-3 flex items-center justify-between">
      {/* Brand logo & title */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-tr from-red-600 via-rose-500 to-indigo-600 shadow-md shadow-red-500/20">
          <YoutubeIcon className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-lg tracking-tight text-white">
              Video<span className="text-indigo-400">Mind</span>
            </span>
            <span className="text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              RAG AI
            </span>
          </div>
          {activeVideoTitle ? (
            <p className="text-xs text-slate-400 max-w-sm truncate hidden sm:block">
              {activeVideoTitle}
            </p>
          ) : (
            <p className="text-xs text-slate-400 hidden sm:block">
              YouTube Video Intelligence & Timestamped Q&A
            </p>
          )}
        </div>
      </div>

      {/* Right actions: Backend status & Action button */}
      <div className="flex items-center gap-3">
        {/* Backend health status badge */}
        <div
          title={
            isBackendHealthy
              ? "FastAPI backend running at http://localhost:8000"
              : "Backend offline. Make sure run.py is running on port 8000."
          }
          className="flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-medium border bg-[#111827]/80 backdrop-blur"
          style={{
            borderColor: isBackendHealthy
              ? "rgba(16, 185, 129, 0.3)"
              : "rgba(239, 68, 68, 0.3)",
          }}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              isBackendHealthy
                ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]"
                : "bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]"
            }`}
          />
          <span className="text-slate-300 text-[11px] hidden sm:inline">
            {isBackendHealthy ? "Backend Active" : "Backend Offline"}
          </span>
        </div>

        {/* API Docs Link */}
        <a
          href="http://localhost:8000/docs"
          target="_blank"
          rel="noreferrer"
          className="hidden md:flex items-center gap-1.5 text-xs text-slate-400 hover:text-white px-2.5 py-1.5 rounded-lg border border-[rgba(255,255,255,0.06)] hover:bg-white/5 transition"
        >
          <span>API Docs</span>
          <ExternalLinkIcon className="w-3 h-3" />
        </a>

        {/* Ingest Video Button */}
        <button
          onClick={onOpenIngest}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-red-600 to-indigo-600 hover:from-red-500 hover:to-indigo-500 shadow-md shadow-indigo-500/20 active:scale-95 transition"
        >
          <PlusIcon className="w-3.5 h-3.5" />
          <span>Add Video</span>
        </button>
      </div>
    </header>
  );
}
