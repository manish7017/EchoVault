"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Archive,
  Image as ImageIcon,
  Mic,
  FileText,
  Feather,
  Search,
  Plus,
  Ghost,
  MessageSquareQuote,
  Clock,
  Layers,
  ArrowRight,
  HardDrive,
  FolderLock
} from "lucide-react";
import { fetchMemories, fetchCollections, fetchForgottenMemories, fetchStorageStats } from "@/lib/api";
import { Memory, Collection, StorageStats } from "@/lib/types";
import MemoryCard from "@/components/MemoryCard";
import FileUploader from "@/components/FileUploader";

export default function DashboardPage() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [forgotten, setForgotten] = useState<Memory[]>([]);
  const [storage, setStorage] = useState<StorageStats | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const [mems, cols, forg, stor] = await Promise.all([
        fetchMemories({ limit: 6 }),
        fetchCollections(),
        fetchForgottenMemories(3),
        fetchStorageStats().catch(() => null),
      ]);
      setMemories(mems);
      setCollections(cols);
      setForgotten(forg);
      setStorage(stor);
    } catch (err) {
      console.error("Dashboard data load error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-10">
      {/* Top Banner & Quick Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#25221E] pb-6">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-[#D6A65C] block">
            Archival Overview
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl text-[#E8E0D2] font-normal">
            The Digital Archive
          </h1>
          <p className="text-xs text-[#9E988E] font-mono mt-1">
            "Some memories never leave. They just wait to be remembered."
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowUploadModal(true)}
            className="px-4 py-2 text-xs font-mono rounded bg-[#D6A65C] text-[#0D0D0F] hover:bg-[#E5B771] flex items-center space-x-1.5 transition-colors shadow-md shadow-[#D6A65C]/15"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Ingest Artifact</span>
          </button>

          <Link
            href="/ghost-chamber"
            className="px-4 py-2 text-xs font-mono rounded border border-[#5A4A32] bg-[#171513] text-[#D6A65C] hover:bg-[#201C18] flex items-center space-x-1.5 transition-colors"
          >
            <Ghost className="w-3.5 h-3.5" />
            <span>Ghost Chamber</span>
          </Link>
        </div>
      </div>

      {/* Quick Search */}
      <div className="relative max-w-2xl">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#5A4A32]">
          <Search className="w-4 h-4" />
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (searchQuery.trim()) {
              window.location.href = `/vault?q=${encodeURIComponent(searchQuery.trim())}`;
            }
          }}
        >
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search archived letters, dates, people, cassette transcripts, or places..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[#302B24] bg-[#121216] text-xs font-mono text-[#E8E0D2] placeholder-[#605B54] focus:outline-none focus:border-[#D6A65C]"
          />
        </form>
      </div>

      {/* Stats Counter Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-lg border border-[#282522] bg-[#131317]">
          <div className="flex items-center justify-between text-[#7A756D] mb-1">
            <span className="text-[10px] font-mono uppercase">Total Relics</span>
            <Archive className="w-4 h-4 text-[#D6A65C]" />
          </div>
          <div className="font-serif text-2xl text-[#E8E0D2]">
            {storage?.total_memories ?? memories.length}
          </div>
          <div className="text-[10px] font-mono text-[#7E8B68] mt-1">100% locally preserved</div>
        </div>

        <div className="p-4 rounded-lg border border-[#282522] bg-[#131317]">
          <div className="flex items-center justify-between text-[#7A756D] mb-1">
            <span className="text-[10px] font-mono uppercase">Photographs</span>
            <ImageIcon className="w-4 h-4 text-[#D6A65C]" />
          </div>
          <div className="font-serif text-2xl text-[#E8E0D2]">
            {storage?.photos_count ?? 0}
          </div>
          <div className="text-[10px] font-mono text-[#7A756D] mt-1">Local vision analyzed</div>
        </div>

        <div className="p-4 rounded-lg border border-[#282522] bg-[#131317]">
          <div className="flex items-center justify-between text-[#7A756D] mb-1">
            <span className="text-[10px] font-mono uppercase">Audio Reels</span>
            <Mic className="w-4 h-4 text-[#7E8B68]" />
          </div>
          <div className="font-serif text-2xl text-[#E8E0D2]">
            {storage?.audio_count ?? 0}
          </div>
          <div className="text-[10px] font-mono text-[#7A756D] mt-1">Whisper transcribed</div>
        </div>

        <div className="p-4 rounded-lg border border-[#282522] bg-[#131317]">
          <div className="flex items-center justify-between text-[#7A756D] mb-1">
            <span className="text-[10px] font-mono uppercase">Documents & Stories</span>
            <FileText className="w-4 h-4 text-[#5E81AC]" />
          </div>
          <div className="font-serif text-2xl text-[#E8E0D2]">
            {(storage?.documents_count ?? 0) + (storage?.stories_count ?? 0)}
          </div>
          <div className="text-[10px] font-mono text-[#7A756D] mt-1">Semantic vector indexed</div>
        </div>
      </div>

      {/* Collections Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FolderLock className="w-4 h-4 text-[#D6A65C]" />
            <h2 className="font-serif text-lg text-[#E8E0D2]">Archival Collections</h2>
          </div>
          <Link
            href="/vault"
            className="text-xs font-mono text-[#D6A65C] hover:underline flex items-center space-x-1"
          >
            <span>View All</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {collections.map((col) => (
            <Link
              key={col.id}
              href={`/vault?collection=${col.id}`}
              className="p-5 rounded-lg border border-[#282522] bg-[#141418] hover:border-[#5A4A32] hover:bg-[#181820] transition-all group"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono px-2 py-0.5 rounded border border-[#3E3830] bg-[#1A1815] text-[#D6A65C]">
                  {col.memory_count || 0} Relics
                </span>
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: col.color || "#D6A65C" }} />
              </div>
              <h3 className="font-serif text-base text-[#E8E0D2] group-hover:text-[#D6A65C] transition-colors mb-1 line-clamp-1">
                {col.name}
              </h3>
              <p className="text-xs text-[#9E988E] line-clamp-2 leading-relaxed">
                {col.description || "Thematic collection of memories."}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* The Forgotten Drawer Preview */}
      {forgotten.length > 0 && (
        <section className="p-6 rounded-xl border border-[#4A3225] bg-[#161214] relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Layers className="w-4 h-4 text-[#B48EAD]" />
              <h2 className="font-serif text-lg text-[#E8E0D2]">The Forgotten Drawer</h2>
            </div>
            <Link
              href="/forgotten-drawer"
              className="text-xs font-mono text-[#B48EAD] hover:underline flex items-center space-x-1"
            >
              <span>Inspect All Forgotten</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <p className="text-xs text-[#9E988E] max-w-xl mb-4 font-sans">
            These memories have rested in silence for the longest time without inspection.
            Open them to rekindle their forgotten stories.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {forgotten.map((m) => (
              <MemoryCard key={m.id} memory={m} />
            ))}
          </div>
        </section>
      )}

      {/* Recent Ingested Memories */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-[#7E8B68]" />
            <h2 className="font-serif text-lg text-[#E8E0D2]">Recent Ingestions</h2>
          </div>
          <Link
            href="/vault"
            className="text-xs font-mono text-[#D6A65C] hover:underline flex items-center space-x-1"
          >
            <span>Open Full Vault</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-12 text-xs font-mono text-[#7A756D]">
            Accessing archival records...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {memories.map((m) => (
              <MemoryCard key={m.id} memory={m} />
            ))}
          </div>
        )}
      </section>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-xl">
            <FileUploader
              collections={collections}
              onClose={() => setShowUploadModal(false)}
              onUploadSuccess={(newMem) => {
                setMemories([newMem, ...memories]);
                setShowUploadModal(false);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
