"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ExternalLink, Sparkles, BookOpen } from "lucide-react";
import { SourceCitation } from "@/lib/types";

interface CitationBadgeProps {
  citation: SourceCitation;
  index: number;
}

export default function CitationBadge({ citation, index }: CitationBadgeProps) {
  const [isOpen, setIsOpen] = useState(false);

  const matchPercentage = Math.round(citation.similarity_score * 100);

  return (
    <div className="relative inline-block mr-2 mb-2">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center space-x-1 px-2.5 py-1 rounded text-xs font-mono border border-[#4A3E2D] bg-[#17161A] text-[#D6A65C] hover:border-[#D6A65C] hover:bg-[#201D1A] transition-all"
      >
        <span className="w-4 h-4 rounded-full bg-[#D6A65C]/15 flex items-center justify-center text-[10px] text-[#D6A65C] font-semibold">
          {index + 1}
        </span>
        <span className="max-w-[150px] truncate">{citation.title}</span>
        <span className="text-[10px] text-[#7E8B68]">({matchPercentage}%)</span>
      </button>

      {isOpen && (
        <div className="absolute left-0 bottom-full mb-2 w-72 p-3.5 rounded-lg border border-[#5A4A32] bg-[#141418] shadow-2xl z-30 text-xs">
          <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-[#282520]">
            <span className="font-serif text-[#E8E0D2] font-medium truncate">
              {citation.title}
            </span>
            <span className="text-[10px] font-mono text-[#D6A65C] px-1.5 py-0.5 rounded bg-[#201D18] border border-[#403525]">
              {citation.memory_type}
            </span>
          </div>

          <p className="text-[11px] text-[#9E988E] line-clamp-3 mb-2.5 font-sans leading-relaxed italic">
            "{citation.snippet}"
          </p>

          <div className="flex items-center justify-between pt-1 border-t border-[#22201D] text-[10px] font-mono">
            <span className="text-[#7A756D]">
              {citation.recorded_date || "Undated"}
            </span>
            <Link
              href={`/memory/${citation.memory_id}`}
              className="text-[#D6A65C] hover:underline flex items-center space-x-1"
            >
              <span>Inspect Memory</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
