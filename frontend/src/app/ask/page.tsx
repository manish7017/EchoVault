"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  MessageSquareQuote,
  Send,
  Sparkles,
  Bot,
  User,
  History,
  Trash2,
  FolderLock,
  Loader2,
  AlertCircle,
  ExternalLink,
  BookOpen
} from "lucide-react";
import { askArchive, fetchSessions, fetchCollections } from "@/lib/api";
import { ChatMessage, ConversationSession, Collection } from "@/lib/types";
import CitationBadge from "@/components/CitationBadge";

const SUGGESTED_QUERIES = [
  "What happened in December 1994?",
  "Tell me about the brass key in the attic floorboard.",
  "Which records mention Dr. Alistair Finch?",
  "What recurring themes appear across the archived stories?",
  "Did anyone investigate the stone well in Whispering Pines?"
];

export default function AskArchivePage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);
  const [sessions, setSessions] = useState<ConversationSession[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  useEffect(() => {
    fetchSessions()
      .then((data) => setSessions(data))
      .catch(() => {});
    fetchCollections()
      .then((data) => setCollections(data))
      .catch(() => {});
  }, []);

  const handleSend = async (queryText?: string) => {
    const text = queryText || input;
    if (!text.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: "temp-" + Date.now(),
      role: "user",
      content: text.trim(),
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);
    setError(null);

    try {
      const res = await askArchive(text.trim(), sessionId, selectedCollection || undefined);
      setSessionId(res.session_id);
      setMessages((prev) => [...prev, res.message]);

      // Refresh sessions
      fetchSessions().then((data) => setSessions(data)).catch(() => {});
    } catch (err: any) {
      setError(err.message || "Failed to query the archive.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectSession = (s: ConversationSession) => {
    setSessionId(s.id);
    setMessages(s.messages || []);
  };

  const handleNewChat = () => {
    setSessionId(undefined);
    setMessages([]);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1 flex flex-col md:flex-row gap-6">
      {/* Left Sidebar: Sessions and Archival Scopes */}
      <div className="w-full md:w-72 flex-shrink-0 space-y-5">
        <div className="rounded-xl border border-[#282522] bg-[#121115] p-4 space-y-4">
          <div className="flex items-center justify-between border-b border-[#22201D] pb-3">
            <span className="text-xs font-mono uppercase tracking-wider text-[#D6A65C] font-medium">
              Consultations
            </span>
            <button
              onClick={handleNewChat}
              className="text-xs font-mono px-2 py-1 rounded bg-[#201D18] border border-[#403525] text-[#D6A65C] hover:bg-[#2C261E]"
            >
              + New Query
            </button>
          </div>

          {/* Collection Scope */}
          <div className="space-y-1">
            <label className="text-[11px] font-mono text-[#7A756D]">Archival Scope</label>
            <select
              value={selectedCollection}
              onChange={(e) => setSelectedCollection(e.target.value)}
              className="w-full text-xs font-mono px-2.5 py-1.5 rounded bg-[#0A0A0C] border border-[#282522] text-[#E8E0D2] focus:border-[#D6A65C] focus:outline-none"
            >
              <option value="">Entire Archive (All Collections)</option>
              {collections.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Past Sessions List */}
          <div className="space-y-1 pt-2 border-t border-[#22201D] max-h-72 overflow-y-auto">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#7A756D] block mb-1">
              Previous Inquiries
            </span>
            {sessions.length === 0 ? (
              <p className="text-xs font-mono text-[#605B54] italic">No previous sessions</p>
            ) : (
              sessions.map((s) => (
                <button
                  key={s.id}
                  onClick={() => handleSelectSession(s)}
                  className={`w-full text-left px-2.5 py-2 rounded text-xs font-mono truncate transition-all ${
                    s.id === sessionId
                      ? "bg-[#221F1A] text-[#D6A65C] border border-[#5A4A32]"
                      : "text-[#9E988E] hover:bg-[#181820] hover:text-[#E8E0D2]"
                  }`}
                >
                  {s.title}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Offline & Grounding Banner */}
        <div className="rounded-xl border border-[#282522] bg-[#121115] p-4 text-xs font-mono text-[#7A756D] space-y-2">
          <div className="flex items-center space-x-1.5 text-[#7E8B68]">
            <BookOpen className="w-3.5 h-3.5" />
            <span className="text-xs uppercase font-medium">Grounding Promise</span>
          </div>
          <p className="text-[11px] leading-relaxed">
            The Guardian answers strictly from your retrieved memory chunks. If an event or person was never archived, it will plainly declare the lack of evidence.
          </p>
        </div>
      </div>

      {/* Main Conversation Window */}
      <div className="flex-1 flex flex-col rounded-xl border border-[#282522] bg-[#101014] overflow-hidden min-h-[600px] shadow-2xl">
        {/* Header Bar */}
        <div className="p-4 border-b border-[#22201D] bg-[#141418] flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-full bg-[#1C1814] border border-[#5A4A32] flex items-center justify-center text-[#D6A65C]">
              <MessageSquareQuote className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-serif text-sm text-[#E8E0D2]">
                Archive Guardian Consultation
              </h2>
              <p className="text-[10px] font-mono text-[#7A756D]">
                Powered by local vector search & open-weight language inference
              </p>
            </div>
          </div>
        </div>

        {/* Messages Container */}
        <div className="flex-1 p-5 overflow-y-auto space-y-6">
          {messages.length === 0 ? (
            <div className="py-12 max-w-lg mx-auto text-center space-y-6">
              <div className="w-12 h-12 rounded-full border border-[#3B3428] bg-[#161418] flex items-center justify-center text-[#D6A65C] mx-auto">
                <Bot className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h3 className="font-serif text-lg text-[#E8E0D2] mb-1">
                  The Archive Awaits Your Inquiry
                </h3>
                <p className="text-xs text-[#9E988E] font-sans">
                  Ask about specific people, dates, past conversations, cassette audio recordings, or recurring mysteries.
                </p>
              </div>

              {/* Suggested Questions */}
              <div className="space-y-2 text-left">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#7A756D] block">
                  Inquire of the records:
                </span>
                {SUGGESTED_QUERIES.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(q)}
                    className="w-full text-left p-2.5 rounded-lg border border-[#242220] bg-[#141318] hover:border-[#5A4A32] hover:bg-[#1C1A20] text-xs font-mono text-[#E8E0D2] transition-colors"
                  >
                    "{q}"
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((m) => (
              <div
                key={m.id}
                className={`flex space-x-3 ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {m.role === "assistant" && (
                  <div className="w-8 h-8 rounded-full bg-[#1C1814] border border-[#5A4A32] flex items-center justify-center text-[#D6A65C] flex-shrink-0 mt-1">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-2xl rounded-xl p-4 text-xs font-sans leading-relaxed ${
                    m.role === "user"
                      ? "bg-[#D6A65C] text-[#0D0D0F] font-mono font-medium rounded-tr-none"
                      : "bg-[#16151B] text-[#E8E0D2] border border-[#282522] rounded-tl-none space-y-3"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.content}</p>

                  {/* Sources and Citations */}
                  {m.sources && m.sources.length > 0 && (
                    <div className="pt-3 border-t border-[#22201D] mt-3">
                      <div className="text-[10px] font-mono text-[#D6A65C] uppercase tracking-wider mb-2 flex items-center space-x-1">
                        <Sparkles className="w-3 h-3" />
                        <span>Referenced Archival Sources:</span>
                      </div>
                      <div className="flex flex-wrap">
                        {m.sources.map((cit, idx) => (
                          <CitationBadge key={idx} citation={cit} index={idx} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {m.role === "user" && (
                  <div className="w-8 h-8 rounded-full bg-[#201D1A] border border-[#443828] flex items-center justify-center text-[#E8E0D2] flex-shrink-0 mt-1">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))
          )}

          {isLoading && (
            <div className="flex space-x-3 items-center text-xs font-mono text-[#D6A65C]">
              <div className="w-8 h-8 rounded-full bg-[#1C1814] border border-[#5A4A32] flex items-center justify-center text-[#D6A65C] flex-shrink-0">
                <Loader2 className="w-4 h-4 animate-spin" />
              </div>
              <div className="p-3 rounded-lg bg-[#16151B] border border-[#282522]">
                Consulting memory embeddings & formulating evidence-grounded answer...
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-lg border border-red-900/40 bg-red-950/20 text-xs text-red-300 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Query Input Box */}
        <div className="p-4 border-t border-[#22201D] bg-[#121216]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center space-x-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask the archive a question about your memories..."
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 rounded-lg border border-[#2C2925] bg-[#0A0A0C] text-xs font-mono text-[#E8E0D2] focus:border-[#D6A65C] focus:outline-none"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="px-4 py-2.5 rounded-lg bg-[#D6A65C] text-[#0D0D0F] hover:bg-[#E5B771] disabled:opacity-50 transition-colors shadow-md shadow-[#D6A65C]/15"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
