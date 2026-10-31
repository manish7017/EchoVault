"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Layers,
  Sparkles,
  Archive,
  Ghost,
  Eye,
  History,
  Clock,
  Compass,
  ArrowRight
} from "lucide-react";
import { fetchForgottenMemories } from "@/lib/api";
import { Memory } from "@/lib/types";
import MemoryCard from "@/components/MemoryCard";

export default function ForgottenDrawerPage() {
  const [forgotten, setForgotten] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchForgottenMemories(12)
      .then((data) => setForgotten(data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-10">
      {/* Header */}
      <div className="border-b border-[#25221E] pb-6 max-w-3xl space-y-3">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full border border-[#4A3245] bg-[#1C141C] text-xs font-mono text-[#B48EAD]">
          <Layers className="w-3.5 h-3.5" />
          <span>The Abandoned Compartment</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl text-[#E8E0D2] font-normal">
          The Forgotten Drawer
        </h1>
        <p className="font-serif italic text-base text-[#D6A65C]">
          "What remains in darkness until someone reaches into the dust?"
        </p>
        <p className="text-xs text-[#9E988E] font-sans leading-relaxed">
          This chamber actively monitors your archive for relics that have slipped into silence—memories not accessed for months, photographs lacking personal descriptions, and recordings awaiting closer listening.
        </p>
      </div>

      {/* Discovery Grid */}
      {loading ? (
        <div className="py-20 text-center text-xs font-mono text-[#7A756D]">
          Pulling open the forgotten drawer...
        </div>
      ) : forgotten.length === 0 ? (
        <div className="py-20 text-center rounded-xl border border-dashed border-[#282522] bg-[#121115] p-8">
          <Archive className="w-12 h-12 text-[#5A4A32] mx-auto mb-3" />
          <h3 className="font-serif text-lg text-[#E8E0D2] mb-1">
            No Neglected Relics
          </h3>
          <p className="text-xs text-[#9E988E] max-w-sm mx-auto font-sans">
            Every memory in your vault has been frequently consulted. As your archive ages, forgotten fragments will naturally surface here.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between text-xs font-mono text-[#7A756D]">
            <span>Surfacing {forgotten.length} quiet memories</span>
            <Link
              href="/ghost-chamber"
              className="text-[#D6A65C] hover:underline flex items-center space-x-1"
            >
              <span>Bring them to the Ghost Chamber</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {forgotten.map((m) => (
              <MemoryCard key={m.id} memory={m} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
