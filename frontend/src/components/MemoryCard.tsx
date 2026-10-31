"use client";

import React from "react";
import Link from "next/link";
import { Image as ImageIcon, Mic, FileText, Feather, Calendar, MapPin, Tag, Sparkles } from "lucide-react";
import { Memory } from "@/lib/types";
import { formatDate } from "@/lib/utils";

interface MemoryCardProps {
  memory: Memory;
}

export default function MemoryCard({ memory }: MemoryCardProps) {
  const getTypeBadge = () => {
    switch (memory.memory_type) {
      case "photo":
        return { label: "Photograph", icon: ImageIcon, color: "text-[#D6A65C] border-[#5A4A32] bg-[#1C1813]" };
      case "audio":
        return { label: "Voice / Audio", icon: Mic, color: "text-[#7E8B68] border-[#3B4530] bg-[#161B14]" };
      case "document":
        return { label: "Document", icon: FileText, color: "text-[#5E81AC] border-[#303E4F] bg-[#141A22]" };
      case "story":
        return { label: "Recollection", icon: Feather, color: "text-[#B48EAD] border-[#4A3245] bg-[#1D141C]" };
      default:
        return { label: "Archive", icon: FileText, color: "text-[#9E988E] border-[#2C2925] bg-[#141418]" };
    }
  };

  const badge = getTypeBadge();
  const Icon = badge.icon;

  return (
    <Link
      href={`/memory/${memory.id}`}
      className="group block relative rounded-lg border border-[#282522] bg-[#131317] hover:bg-[#181820] hover:border-[#5A4A32] transition-all duration-300 p-5 shadow-sm hover:shadow-xl hover:shadow-[#D6A65C]/5"
    >
      {/* Top accession bar */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <span className={`inline-flex items-center space-x-1 text-[11px] font-mono px-2 py-0.5 rounded border ${badge.color}`}>
            <Icon className="w-3 h-3" />
            <span>{badge.label}</span>
          </span>

          {memory.is_sample && (
            <span className="text-[10px] font-mono tracking-tight px-1.5 py-0.5 rounded border border-[#443E36] bg-[#1A1815] text-[#D6A65C]">
              Sample Archive
            </span>
          )}
        </div>

        <div className="flex items-center space-x-1.5 text-[10px] font-mono text-[#7A756D]">
          {memory.processing_status === "processing" ? (
            <span className="flex items-center space-x-1 text-[#D6A65C] animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-[#D6A65C]" />
              <span>Analyzing...</span>
            </span>
          ) : memory.processing_status === "completed" ? (
            <span className="flex items-center space-x-1 text-[#7E8B68]" title="AI Indexed">
              <span className="w-1.5 h-1.5 rounded-full bg-[#7E8B68]" />
              <span>Indexed</span>
            </span>
          ) : memory.processing_status === "failed" ? (
            <span className="text-red-400">Analysis Error</span>
          ) : (
            <span>Pending</span>
          )}
        </div>
      </div>

      {/* Memory Title */}
      <h3 className="font-serif text-base text-[#E8E0D2] group-hover:text-[#D6A65C] transition-colors line-clamp-1 mb-2">
        {memory.title}
      </h3>

      {/* AI Summary or Excerpt */}
      <p className="text-xs text-[#9E988E] line-clamp-3 mb-4 leading-relaxed font-sans">
        {memory.ai_summary || memory.description || "Archival record waiting for inspection..."}
      </p>

      {/* Metadata footer */}
      <div className="pt-3 border-t border-[#22201D] flex flex-wrap items-center justify-between gap-y-2 text-[11px] font-mono text-[#7A756D]">
        <div className="flex items-center space-x-3">
          {memory.recorded_date && (
            <span className="flex items-center space-x-1">
              <Calendar className="w-3 h-3 text-[#5A4A32]" />
              <span>{formatDate(memory.recorded_date)}</span>
            </span>
          )}
          {memory.location && (
            <span className="flex items-center space-x-1 max-w-[140px] truncate" title={memory.location}>
              <MapPin className="w-3 h-3 text-[#5A4A32]" />
              <span className="truncate">{memory.location}</span>
            </span>
          )}
        </div>

        {/* Tags preview */}
        {memory.tags && memory.tags.length > 0 && (
          <div className="flex items-center space-x-1">
            <span className="text-[10px] text-[#5A4A32]">#</span>
            <span className="text-[10px] text-[#9E988E] bg-[#181820] px-1.5 py-0.5 rounded border border-[#282522]">
              {memory.tags[0]}
            </span>
            {memory.tags.length > 1 && (
              <span className="text-[10px] text-[#7A756D]">+{memory.tags.length - 1}</span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}
