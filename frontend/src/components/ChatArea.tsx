"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChatMessage, SourceItem } from "@/types/api";
import {
  SendIcon,
  SparklesIcon,
  CopyIcon,
  CheckIcon,
  PlayIcon,
  ExternalLinkIcon,
  LoaderIcon,
} from "./Icons";

interface ChatAreaProps {
  videoId: string;
  messages: ChatMessage[];
  suggestedQuestions: string[];
  isAnswering: boolean;
  onSendMessage: (question: string) => void;
  onSeek: (timeSeconds: number) => void;
  onOpenIngest: () => void;
}

export function ChatArea({
  videoId,
  messages,
  suggestedQuestions,
  isAnswering,
  onSendMessage,
  onSeek,
  onOpenIngest,
}: ChatAreaProps) {
  const [input, setInput] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of conversation
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isAnswering]);

  const handleSend = (text?: string) => {
    const q = text || input.trim();
    if (!q || isAnswering) return;
    setInput("");
    onSendMessage(q);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#07090e]/60">
      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Empty state when no messages */}
        {messages.length === 0 && (
          <div className="max-w-2xl mx-auto py-8 text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-500/20 via-purple-500/20 to-red-500/20 border border-indigo-500/30 flex items-center justify-center mx-auto shadow-xl shadow-indigo-500/10">
              <SparklesIcon className="w-8 h-8 text-indigo-400" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-bold text-white tracking-tight">
                Ask anything about this video
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
                VideoMind searches through indexed transcript chunks and generates
                grounded, timestamped explanations using Gemini.
              </p>
            </div>

            {/* Suggested questions chips */}
            {suggestedQuestions.length > 0 && (
              <div className="space-y-2.5 pt-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Recommended Questions to Ask:
                </span>
                <div className="flex flex-wrap justify-center gap-2">
                  {suggestedQuestions.map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSend(q)}
                      className="text-xs bg-[#111827] hover:bg-[#1a2542] text-slate-300 hover:text-white border border-[rgba(255,255,255,0.08)] hover:border-indigo-500/50 px-3.5 py-2 rounded-xl transition shadow-sm"
                    >
                      💡 {q}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Render Chat Messages */}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${
              msg.role === "user" ? "items-end" : "items-start"
            }`}
          >
            {/* User Message */}
            {msg.role === "user" ? (
              <div className="max-w-[85%] sm:max-w-lg bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-2xl rounded-tr-sm px-4 py-3 text-sm shadow-lg shadow-indigo-600/20">
                <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                <span className="block text-[10px] text-indigo-200/70 mt-1 text-right">
                  {msg.timestamp}
                </span>
              </div>
            ) : (
              /* Assistant / RAG Response */
              <div className="w-full max-w-3xl glass-panel p-5 space-y-4 border border-[rgba(255,255,255,0.08)] bg-[#0f172a]/90 shadow-2xl">
                {/* Assistant Card Header */}
                <div className="flex items-center justify-between pb-3 border-b border-white/5">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                      <SparklesIcon className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-bold text-indigo-300 tracking-wide">
                      VideoMind RAG Answer
                    </span>
                  </div>

                  <button
                    onClick={() => handleCopy(msg.id, msg.content)}
                    className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white px-2 py-1 rounded bg-white/5 hover:bg-white/10 transition"
                  >
                    {copiedId === msg.id ? (
                      <>
                        <CheckIcon className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <CopyIcon className="w-3 h-3" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Formatted Answer Body */}
                <div className="rag-content whitespace-pre-wrap">
                  {msg.content}
                </div>

                {/* Grounding Sources & Timestamp Badges */}
                {msg.sources && msg.sources.length > 0 && (
                  <div className="pt-3 border-t border-white/5 space-y-2.5">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      Video Timestamp Citations ({msg.sources.length}):
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {msg.sources.map((src: SourceItem, idx: number) => (
                        <div
                          key={idx}
                          className="p-2.5 rounded-xl bg-[#090d16] border border-white/5 hover:border-indigo-500/30 transition flex flex-col justify-between gap-2"
                        >
                          <p className="text-[11px] text-slate-300 line-clamp-2 italic leading-relaxed">
                            &ldquo;{src.text}&rdquo;
                          </p>
                          <div className="flex items-center justify-between pt-1 border-t border-white/5">
                            <button
                              onClick={() => onSeek(src.start_time)}
                              className="flex items-center gap-1.5 font-mono text-[11px] font-bold text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 px-2 py-0.5 rounded border border-indigo-500/30 transition"
                            >
                              <PlayIcon className="w-2.5 h-2.5" />
                              <span>
                                {src.start_timestamp} - {src.end_timestamp}
                              </span>
                            </button>
                            <a
                              href={src.youtube_url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1"
                            >
                              <span>YouTube</span>
                              <ExternalLinkIcon className="w-2.5 h-2.5" />
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {/* Loading Skeleton during RAG Answering */}
        {isAnswering && (
          <div className="w-full max-w-2xl glass-panel p-5 border border-indigo-500/30 bg-[#0f172a]/90 space-y-3 animate-pulse">
            <div className="flex items-center gap-2">
              <LoaderIcon className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-semibold text-indigo-300">
                Searching FAISS vector database & synthesizing answer with Gemini...
              </span>
            </div>
            <div className="space-y-2 pt-1">
              <div className="h-3.5 bg-white/10 rounded w-full" />
              <div className="h-3.5 bg-white/10 rounded w-4/5" />
              <div className="h-3.5 bg-white/10 rounded w-3/5" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Questions Pills above input if messages exist */}
      {messages.length > 0 && suggestedQuestions.length > 0 && (
        <div className="px-4 sm:px-6 py-2 border-t border-white/5 bg-[#0a0f1c]/50 flex items-center gap-2 overflow-x-auto no-scrollbar">
          <span className="text-[10px] uppercase font-bold text-slate-400 shrink-0">
            Suggested:
          </span>
          {suggestedQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(q)}
              disabled={isAnswering}
              className="shrink-0 text-xs bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 px-3 py-1 rounded-full transition disabled:opacity-50"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Floating Chat Input Bar */}
      <div className="p-4 sm:p-6 border-t border-[rgba(255,255,255,0.08)] bg-[#090d16]/95 backdrop-blur-lg">
        <div className="max-w-3xl mx-auto flex items-center gap-2 bg-[#12192b] border border-[rgba(255,255,255,0.12)] focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 rounded-2xl p-1.5 shadow-2xl transition">
          <input
            type="text"
            placeholder={
              videoId
                ? "Ask a question about this video (e.g. 'What algorithms are explained?')..."
                : "Select or ingest a video to start asking questions..."
            }
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isAnswering || !videoId}
            className="flex-1 bg-transparent px-4 py-2 text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none disabled:opacity-50"
          />

          <button
            onClick={() => handleSend()}
            disabled={isAnswering || !input.trim() || !videoId}
            className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white shadow-md shadow-indigo-600/30 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition"
            title="Send Question"
          >
            {isAnswering ? (
              <LoaderIcon className="w-4 h-4" />
            ) : (
              <SendIcon className="w-4 h-4" />
            )}
          </button>
        </div>
        <p className="text-[10px] text-slate-400 text-center mt-2">
          Press <kbd className="px-1.5 py-0.5 rounded bg-white/10 font-mono text-[9px] text-slate-300">Enter</kbd> to submit. Answers are grounded in the YouTube transcript.
        </p>
      </div>
    </div>
  );
}
