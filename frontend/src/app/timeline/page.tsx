"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Clock,
  Calendar,
  Filter,
  User,
  Tag as TagIcon,
  MapPin,
  Share2,
  ExternalLink,
  RotateCcw,
  Layers,
  ChevronRight
} from "lucide-react";
import { fetchTimeline, fetchMemoryConnections } from "@/lib/api";
import { TimelineData, ConnectionGraph, Memory } from "@/lib/types";
import MemoryCard from "@/components/MemoryCard";

export default function TimelinePage() {
  const [timeline, setTimeline] = useState<TimelineData | null>(null);
  const [connections, setConnections] = useState<ConnectionGraph | null>(null);
  const [selectedPerson, setSelectedPerson] = useState<string>("");
  const [selectedTopic, setSelectedTopic] = useState<string>("");
  const [selectedType, setSelectedType] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"chronology" | "connections">("chronology");
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const [tl, conn] = await Promise.all([
        fetchTimeline({
          person: selectedPerson || undefined,
          topic: selectedTopic || undefined,
          memory_type: selectedType || undefined,
        }),
        fetchMemoryConnections()
      ]);
      setTimeline(tl);
      setConnections(conn);
    } catch (err) {
      console.error("Timeline data load error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedPerson, selectedTopic, selectedType]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#25221E] pb-6">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-[#D6A65C] block">
            Chronological Exploration
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl text-[#E8E0D2] font-normal">
            Memory Timeline & Echoes
          </h1>
          <p className="text-xs text-[#9E988E] font-mono mt-1">
            Browse memories grouped across decades and discover subterranean connections between artifacts.
          </p>
        </div>

        {/* View Switcher */}
        <div className="flex items-center space-x-2 bg-[#121216] p-1 rounded-lg border border-[#282522]">
          <button
            onClick={() => setActiveTab("chronology")}
            className={`px-3 py-1.5 text-xs font-mono rounded flex items-center space-x-1.5 transition-colors ${
              activeTab === "chronology"
                ? "bg-[#D6A65C] text-[#0D0D0F] font-medium"
                : "text-[#9E988E] hover:text-[#E8E0D2]"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Chronology</span>
          </button>

          <button
            onClick={() => setActiveTab("connections")}
            className={`px-3 py-1.5 text-xs font-mono rounded flex items-center space-x-1.5 transition-colors ${
              activeTab === "connections"
                ? "bg-[#D6A65C] text-[#0D0D0F] font-medium"
                : "text-[#9E988E] hover:text-[#E8E0D2]"
            }`}
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Connection Graph</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="rounded-xl border border-[#282522] bg-[#111115] p-4 flex flex-wrap items-center gap-3">
        <span className="text-xs font-mono text-[#7A756D] flex items-center space-x-1">
          <Filter className="w-3.5 h-3.5" />
          <span>Filters:</span>
        </span>

        {/* People Dropdown */}
        <select
          value={selectedPerson}
          onChange={(e) => setSelectedPerson(e.target.value)}
          className="text-xs font-mono px-3 py-1.5 rounded bg-[#09090C] border border-[#282522] text-[#E8E0D2] focus:border-[#D6A65C] focus:outline-none"
        >
          <option value="">All People</option>
          {timeline?.filter_options?.people?.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>

        {/* Topics Dropdown */}
        <select
          value={selectedTopic}
          onChange={(e) => setSelectedTopic(e.target.value)}
          className="text-xs font-mono px-3 py-1.5 rounded bg-[#09090C] border border-[#282522] text-[#E8E0D2] focus:border-[#D6A65C] focus:outline-none"
        >
          <option value="">All Topics</option>
          {timeline?.filter_options?.topics?.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>

        {/* Type Dropdown */}
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="text-xs font-mono px-3 py-1.5 rounded bg-[#09090C] border border-[#282522] text-[#E8E0D2] focus:border-[#D6A65C] focus:outline-none"
        >
          <option value="">All File Types</option>
          <option value="photo">Photos</option>
          <option value="audio">Audio Reels</option>
          <option value="document">Documents</option>
          <option value="story">Written Recollections</option>
        </select>

        {(selectedPerson || selectedTopic || selectedType) && (
          <button
            onClick={() => {
              setSelectedPerson("");
              setSelectedTopic("");
              setSelectedType("");
            }}
            className="text-xs font-mono text-[#D6A65C] hover:underline flex items-center space-x-1 ml-auto"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="py-20 text-center text-xs font-mono text-[#7A756D]">
          Calibrating chronological timeline...
        </div>
      ) : activeTab === "chronology" ? (
        <div className="space-y-12">
          {timeline?.clusters?.map((cluster) => (
            <div key={cluster.year} className="relative pl-6 md:pl-10 border-l border-[#3B3428] space-y-6">
              {/* Year marker badge */}
              <div className="absolute -left-3.5 top-0 w-7 h-7 rounded-full bg-[#181820] border-2 border-[#D6A65C] flex items-center justify-center text-[11px] font-mono font-bold text-[#D6A65C]">
                •
              </div>

              <div className="flex items-center space-x-3">
                <h2 className="font-serif text-2xl text-[#E8E0D2] font-semibold">
                  {cluster.year}
                </h2>
                <span className="text-xs font-mono text-[#D6A65C] px-2 py-0.5 rounded border border-[#403525] bg-[#1A1815]">
                  {cluster.count} {cluster.count === 1 ? "relic" : "relics"} preserved
                </span>
              </div>

              {/* Cards for this year */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {cluster.memories.map((m) => (
                  <MemoryCard key={m.id} memory={m} />
                ))}
              </div>
            </div>
          ))}

          {/* Undated memories */}
          {timeline?.undated && timeline.undated.length > 0 && (
            <div className="relative pl-6 md:pl-10 border-l border-dashed border-[#282522] space-y-6 pt-6">
              <div className="absolute -left-3.5 top-6 w-7 h-7 rounded-full bg-[#141418] border border-[#5A4A32] flex items-center justify-center text-[10px] font-mono text-[#7A756D]">
                ?
              </div>
              <div className="flex items-center space-x-3">
                <h2 className="font-serif text-xl text-[#9E988E]">
                  Undated Archive Fragments
                </h2>
                <span className="text-xs font-mono text-[#7A756D]">
                  {timeline.undated.length} relics
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {timeline.undated.map((m) => (
                  <MemoryCard key={m.id} memory={m} />
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Connection Graph & Thread Visualization */
        <div className="space-y-6">
          <div className="rounded-xl border border-[#282522] bg-[#121115] p-6 space-y-4">
            <div className="border-b border-[#22201D] pb-3">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#D6A65C] block">
                Subterranean Connections
              </span>
              <h2 className="font-serif text-lg text-[#E8E0D2]">
                Interconnected Relic Threads
              </h2>
              <p className="text-xs text-[#9E988E] font-sans mt-0.5">
                EchoVault dynamically identifies shared people, locations, and topics that bind disparate memories together across decades.
              </p>
            </div>

            {connections?.edges?.length === 0 ? (
              <p className="text-xs font-mono text-[#7A756D] py-8 text-center">
                No connections detected yet between the current memories.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {connections?.edges?.map((edge, idx) => {
                  const srcNode = connections.nodes.find(n => n.id === edge.source);
                  const tgtNode = connections.nodes.find(n => n.id === edge.target);
                  return (
                    <div
                      key={idx}
                      className="p-4 rounded-lg border border-[#2C2925] bg-[#16151B] space-y-3"
                    >
                      <div className="flex items-center justify-between text-xs font-mono">
                        <Link
                          href={`/memory/${edge.source}`}
                          className="text-[#E8E0D2] hover:text-[#D6A65C] truncate max-w-[140px] font-serif font-medium"
                        >
                          {srcNode?.title || "Memory A"}
                        </Link>
                        <span className="text-[#D6A65C] px-2 py-0.5 rounded bg-[#201D17] border border-[#3E3830] text-[10px]">
                          Strength: {edge.weight}
                        </span>
                        <Link
                          href={`/memory/${edge.target}`}
                          className="text-[#E8E0D2] hover:text-[#D6A65C] truncate max-w-[140px] font-serif font-medium text-right"
                        >
                          {tgtNode?.title || "Memory B"}
                        </Link>
                      </div>

                      <div className="flex flex-wrap gap-1.5 pt-2 border-t border-[#22201D]">
                        {edge.reasons.map((r, rIdx) => (
                          <span
                            key={rIdx}
                            className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#101014] text-[#9E988E] border border-[#242220]"
                          >
                            {r}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
