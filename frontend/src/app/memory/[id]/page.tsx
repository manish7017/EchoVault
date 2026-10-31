"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Tag as TagIcon,
  Sparkles,
  Cpu,
  History,
  Trash2,
  RefreshCw,
  FileText,
  Mic,
  Image as ImageIcon,
  Feather,
  Info,
  CheckCircle2,
  AlertCircle,
  ExternalLink
} from "lucide-react";
import { fetchMemoryDetail, deleteMemory, reprocessMemory, getFileUrl } from "@/lib/api";
import { MemoryDetail } from "@/lib/types";
import { formatDate, formatBytes } from "@/lib/utils";
import AudioPlayer from "@/components/AudioPlayer";
import MemoryCard from "@/components/MemoryCard";

export default function MemoryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [memory, setMemory] = useState<MemoryDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isReprocessing, setIsReprocessing] = useState(false);

  const loadMemory = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const data = await fetchMemoryDetail(id);
      setMemory(data);
    } catch (err: any) {
      setError(err.message || "Failed to load memory");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMemory();
  }, [id]);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to permanently delete this memory from the archive?")) return;
    try {
      await deleteMemory(id);
      router.push("/vault");
    } catch (err: any) {
      alert("Delete failed: " + err.message);
    }
  };

  const handleReprocess = async () => {
    try {
      setIsReprocessing(true);
      await reprocessMemory(id);
      setTimeout(() => {
        loadMemory();
        setIsReprocessing(false);
      }, 2000);
    } catch (err: any) {
      alert("Reprocess error: " + err.message);
      setIsReprocessing(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-20 text-center text-xs font-mono text-[#7A756D]">
        Unsealing archival record #{id?.slice(0, 8)}...
      </div>
    );
  }

  if (error || !memory) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
        <h2 className="font-serif text-lg text-[#E8E0D2] mb-2">Record Not Found</h2>
        <p className="text-xs text-[#9E988E] mb-4">{error || "This memory does not exist or has been wiped."}</p>
        <Link href="/vault" className="px-4 py-2 text-xs font-mono rounded bg-[#D6A65C] text-[#0D0D0F]">
          Return to Vault
        </Link>
      </div>
    );
  }

  const peopleEntities = memory.entities?.filter(e => e.entity_type === "person") || [];
  const locationEntities = memory.entities?.filter(e => e.entity_type === "location") || [];
  const topicEntities = memory.entities?.filter(e => e.entity_type === "topic") || [];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
      {/* Top Navigation & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#25221E] pb-4">
        <Link
          href="/vault"
          className="inline-flex items-center space-x-1.5 text-xs font-mono text-[#9E988E] hover:text-[#D6A65C] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Memory Vault</span>
        </Link>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleReprocess}
            disabled={isReprocessing}
            title="Re-run local AI pipeline (OCR/Vision, Whisper, Entities, Embeddings)"
            className="px-3 py-1.5 text-xs font-mono rounded border border-[#3E3830] bg-[#141418] text-[#9E988E] hover:text-[#E8E0D2] flex items-center space-x-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isReprocessing ? "animate-spin text-[#D6A65C]" : ""}`} />
            <span>{isReprocessing ? "Analyzing..." : "Re-index"}</span>
          </button>

          <button
            onClick={handleDelete}
            title="Permanently remove from local storage"
            className="px-3 py-1.5 text-xs font-mono rounded border border-red-900/40 bg-red-950/20 text-red-300 hover:bg-red-950/40 flex items-center space-x-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Purge Record</span>
          </button>
        </div>
      </div>

      {/* Main Archival Record Header */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-[#5A4A32] bg-[#1E1B16] text-[#D6A65C] uppercase tracking-wider">
            {memory.memory_type}
          </span>
          {memory.is_sample && (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-[#443E36] bg-[#1A1815] text-[#D6A65C]">
              Fictional Demo Artifact
            </span>
          )}
          {memory.collection_name && (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-[#2C2925] bg-[#141418] text-[#9E988E]">
              {memory.collection_name}
            </span>
          )}
          <span className="text-[10px] font-mono text-[#7A756D] ml-auto">
            Accession #{memory.id.slice(0, 8)} • Consulted {memory.access_count} times
          </span>
        </div>

        <h1 className="font-serif text-2xl sm:text-4xl text-[#E8E0D2] font-normal leading-tight">
          {memory.title}
        </h1>

        <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-[#9E988E] pt-1">
          {memory.recorded_date && (
            <div className="flex items-center space-x-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#5A4A32]" />
              <span>{formatDate(memory.recorded_date)}</span>
            </div>
          )}
          {memory.location && (
            <div className="flex items-center space-x-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#5A4A32]" />
              <span>{memory.location}</span>
            </div>
          )}
          {memory.file_size && (
            <div className="flex items-center space-x-1.5">
              <span className="text-[#5A4A32]">Size:</span>
              <span>{formatBytes(memory.file_size)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Content Presentation Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2 cols): Original Artifact & Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Media Player / Image Viewer / Document */}
          {memory.memory_type === "photo" && memory.file_path && (
            <div className="rounded-xl border border-[#3A3326] bg-[#0E0E12] overflow-hidden p-3 shadow-2xl">
              <div className="relative aspect-video max-h-[460px] flex items-center justify-center bg-black/40 rounded-lg overflow-hidden">
                <img
                  src={getFileUrl(memory.file_path)}
                  alt={memory.title}
                  className="max-h-[460px] w-auto object-contain"
                />
              </div>
            </div>
          )}

          {memory.memory_type === "audio" && memory.file_path && (
            <AudioPlayer
              src={getFileUrl(memory.file_path)}
              title={memory.title}
              subtext={`Recorded ${memory.recorded_date || "Unknown"}`}
            />
          )}

          {/* AI-Generated Summary (Clearly Distinguished) */}
          {memory.ai_summary && (
            <div className="rounded-xl border border-[#4A3D28] bg-[#161418] p-5 shadow-lg relative overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2 text-[#D6A65C]">
                  <Sparkles className="w-4 h-4" />
                  <span className="text-xs font-mono uppercase tracking-wider font-semibold">
                    Archival Interpretation (AI Generated)
                  </span>
                </div>
                <span className="text-[10px] font-mono text-[#7A756D]">Local LLM</span>
              </div>
              <p className="text-xs sm:text-sm text-[#E8E0D2] font-serif leading-relaxed italic">
                "{memory.ai_summary}"
              </p>
              <div className="mt-3 text-[10px] font-mono text-[#7A756D] flex items-center space-x-1">
                <Info className="w-3 h-3 text-[#5A4A32]" />
                <span>
                  Interpretation generated locally on your machine. Original facts remain preserved in the raw content.
                </span>
              </div>
            </div>
          )}

          {/* User's Original Notes / Written Memoir */}
          {memory.description && (
            <div className="rounded-xl border border-[#282522] bg-[#131317] p-6 space-y-2">
              <h3 className="font-serif text-sm text-[#D6A65C] uppercase tracking-wider font-medium">
                Personal Notes & Recollection
              </h3>
              <p className="text-xs sm:text-sm text-[#E8E0D2] font-sans leading-relaxed whitespace-pre-wrap">
                {memory.description}
              </p>
            </div>
          )}

          {/* Raw Extracted Content / Transcription */}
          {memory.extracted_text && (
            <div className="rounded-xl border border-[#282522] bg-[#111115] p-6 space-y-3">
              <div className="flex items-center justify-between border-b border-[#22201D] pb-3">
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-[#7E8B68]" />
                  <h3 className="font-serif text-sm text-[#E8E0D2] font-medium">
                    {memory.memory_type === "audio" ? "Audio Transcription" : "Extracted Content / Vision Analysis"}
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-[#7A756D]">
                  {memory.extracted_text.length} characters
                </span>
              </div>

              <div className="text-xs font-mono text-[#9E988E] leading-relaxed whitespace-pre-wrap max-h-96 overflow-y-auto p-3 rounded bg-[#0A0A0C] border border-[#22201D]">
                {memory.extracted_text}
              </div>
            </div>
          )}
        </div>

        {/* Right Column (1 col): Metadata, Entities, Processing History */}
        <div className="space-y-6">
          {/* Extracted Entities Card */}
          <div className="rounded-xl border border-[#282522] bg-[#141418] p-5 space-y-4">
            <h3 className="font-serif text-sm text-[#E8E0D2] border-b border-[#22201D] pb-2">
              Archival Metadata & Entities
            </h3>

            {/* People */}
            {peopleEntities.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#7A756D]">
                  People Mentioned
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {peopleEntities.map((p) => (
                    <span
                      key={p.id}
                      className="text-xs font-mono px-2 py-0.5 rounded border border-[#3E3830] bg-[#1A1815] text-[#D6A65C]"
                    >
                      {p.entity_value}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Locations */}
            {locationEntities.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#7A756D]">
                  Locations Identified
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {locationEntities.map((l) => (
                    <span
                      key={l.id}
                      className="text-xs font-mono px-2 py-0.5 rounded border border-[#283828] bg-[#141C14] text-[#7E8B68]"
                    >
                      {l.entity_value}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Topics */}
            {topicEntities.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#7A756D]">
                  Key Themes & Topics
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {topicEntities.map((t) => (
                    <span
                      key={t.id}
                      className="text-xs font-mono px-2 py-0.5 rounded border border-[#202838] bg-[#121622] text-[#5E81AC]"
                    >
                      {t.entity_value}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Tags */}
            {memory.tags && memory.tags.length > 0 && (
              <div className="space-y-1.5 pt-2 border-t border-[#22201D]">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#7A756D]">
                  Archival Tags
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {memory.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs font-mono px-2 py-0.5 rounded bg-[#1A1A22] text-[#9E988E] border border-[#282522]"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Technical Metadata */}
            {memory.technical_metadata && Object.keys(memory.technical_metadata).length > 0 && (
              <div className="space-y-1.5 pt-2 border-t border-[#22201D]">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#7A756D]">
                  Technical Specs
                </span>
                <div className="text-[11px] font-mono text-[#9E988E] space-y-1">
                  {memory.technical_metadata.camera && (
                    <div>Camera: {memory.technical_metadata.camera}</div>
                  )}
                  {memory.technical_metadata.dimensions && (
                    <div>
                      Dimensions: {memory.technical_metadata.dimensions.width} × {memory.technical_metadata.dimensions.height} px
                    </div>
                  )}
                  {memory.technical_metadata.length_seconds && (
                    <div>Length: {memory.technical_metadata.length_seconds}s</div>
                  )}
                  {memory.technical_metadata.word_count && (
                    <div>Word Count: {memory.technical_metadata.word_count} words</div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Processing Logs Card */}
          <div className="rounded-xl border border-[#282522] bg-[#141418] p-5 space-y-3">
            <div className="flex items-center space-x-2 border-b border-[#22201D] pb-2">
              <History className="w-4 h-4 text-[#D6A65C]" />
              <h3 className="font-serif text-sm text-[#E8E0D2]">
                Echo Engine History
              </h3>
            </div>

            <div className="space-y-2 text-xs font-mono">
              {memory.logs?.map((log) => (
                <div key={log.id} className="flex items-start space-x-2 text-[11px]">
                  {log.status === "completed" ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#7E8B68] flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-3.5 h-3.5 text-[#D6A65C] flex-shrink-0 mt-0.5" />
                  )}
                  <div>
                    <span className="text-[#E8E0D2] font-semibold">{log.step_name}: </span>
                    <span className="text-[#9E988E]">{log.message || log.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Related Memories */}
      {memory.related_memories && memory.related_memories.length > 0 && (
        <section className="pt-8 border-t border-[#25221E] space-y-4">
          <h2 className="font-serif text-xl text-[#E8E0D2]">
            Connected Relics
          </h2>
          <p className="text-xs text-[#9E988E] font-sans">
            Other records sharing common people, places, or themes.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {memory.related_memories.map((rel) => (
              <MemoryCard key={rel.id} memory={rel} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
