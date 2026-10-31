"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Archive,
  Plus,
  Search,
  Filter,
  Image as ImageIcon,
  Mic,
  FileText,
  Feather,
  FolderLock,
  Tag,
  PenTool,
  RotateCcw,
  SlidersHorizontal
} from "lucide-react";
import { fetchMemories, fetchCollections, createManualStory } from "@/lib/api";
import { Memory, Collection } from "@/lib/types";
import MemoryCard from "@/components/MemoryCard";
import FileUploader from "@/components/FileUploader";

function VaultContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const initialCollection = searchParams.get("collection") || "";

  const [memories, setMemories] = useState<Memory[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState(initialQuery);
  const [selectedType, setSelectedType] = useState<string>("");
  const [selectedCollection, setSelectedCollection] = useState<string>(initialCollection);
  const [selectedTag, setSelectedTag] = useState<string>("");

  // Modals
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);

  // Manual Memory Form State
  const [manualTitle, setManualTitle] = useState("");
  const [manualDescription, setManualDescription] = useState("");
  const [manualDate, setManualDate] = useState("");
  const [manualLocation, setManualLocation] = useState("");
  const [manualColId, setManualColId] = useState("");
  const [manualTags, setManualTags] = useState("");
  const [isSubmittingManual, setIsSubmittingManual] = useState(false);

  const loadMemories = async () => {
    try {
      setLoading(true);
      const [mems, cols] = await Promise.all([
        fetchMemories({
          query: search || undefined,
          memory_type: selectedType || undefined,
          collection_id: selectedCollection || undefined,
          tag: selectedTag || undefined,
          limit: 100
        }),
        fetchCollections()
      ]);
      setMemories(mems);
      setCollections(cols);
    } catch (err) {
      console.error("Vault fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMemories();
  }, [search, selectedType, selectedCollection, selectedTag]);

  const handleCreateManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTitle.trim()) return;

    try {
      setIsSubmittingManual(true);
      const tagList = manualTags.split(",").map(t => t.trim()).filter(Boolean);
      const newMemory = await createManualStory({
        title: manualTitle.trim(),
        description: manualDescription.trim(),
        recorded_date: manualDate.trim() || undefined,
        location: manualLocation.trim() || undefined,
        collection_id: manualColId || undefined,
        tags: tagList.length ? tagList : undefined
      });
      setMemories([newMemory, ...memories]);
      setShowManualModal(false);
      setManualTitle("");
      setManualDescription("");
      setManualDate("");
      setManualLocation("");
      setManualTags("");
    } catch (err) {
      console.error("Manual memory creation error:", err);
    } finally {
      setIsSubmittingManual(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
      {/* Header and Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#25221E] pb-6">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-[#D6A65C] block">
            Central Repository
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl text-[#E8E0D2] font-normal">
            The Memory Vault
          </h1>
          <p className="text-xs text-[#9E988E] font-mono mt-1">
            Preserved records, photographs, magnetic tapes, and handwritten memoirs.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowManualModal(true)}
            className="px-4 py-2 text-xs font-mono rounded border border-[#3E3830] bg-[#141418] text-[#E8E0D2] hover:border-[#D6A65C] hover:bg-[#1A1816] flex items-center space-x-1.5 transition-colors"
          >
            <PenTool className="w-3.5 h-3.5 text-[#D6A65C]" />
            <span>Write Recollection</span>
          </button>

          <button
            onClick={() => setShowUploadModal(true)}
            className="px-4 py-2 text-xs font-mono rounded bg-[#D6A65C] text-[#0D0D0F] hover:bg-[#E5B771] flex items-center space-x-1.5 transition-colors shadow-md shadow-[#D6A65C]/15"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Ingest Artifact</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="space-y-4 rounded-xl border border-[#282522] bg-[#111115] p-5">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5A4A32]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter by title, keywords, places, people, or transcription text..."
              className="w-full pl-10 pr-4 py-2 text-xs font-mono rounded-lg bg-[#09090C] border border-[#282522] text-[#E8E0D2] focus:border-[#D6A65C] focus:outline-none"
            />
          </div>

          {/* Collection Filter */}
          <select
            value={selectedCollection}
            onChange={(e) => setSelectedCollection(e.target.value)}
            className="px-3 py-2 text-xs font-mono rounded-lg bg-[#09090C] border border-[#282522] text-[#E8E0D2] focus:border-[#D6A65C] focus:outline-none"
          >
            <option value="">All Collections</option>
            {collections.map((col) => (
              <option key={col.id} value={col.id}>
                {col.name} ({col.memory_count || 0})
              </option>
            ))}
          </select>
        </div>

        {/* Category Type Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#22201D]">
          <span className="text-[11px] font-mono text-[#7A756D] mr-2">Filter Type:</span>
          {[
            { id: "", label: "All Relics", icon: Archive },
            { id: "photo", label: "Photographs", icon: ImageIcon },
            { id: "audio", label: "Audio Reels", icon: Mic },
            { id: "document", label: "Documents", icon: FileText },
            { id: "story", label: "Recollections", icon: Feather },
          ].map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedType === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedType(cat.id)}
                className={`flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-mono transition-all ${
                  isSelected
                    ? "bg-[#D6A65C] text-[#0D0D0F] font-medium"
                    : "border border-[#2C2925] bg-[#16161C] text-[#9E988E] hover:text-[#E8E0D2]"
                }`}
              >
                <Icon className="w-3 h-3" />
                <span>{cat.label}</span>
              </button>
            );
          })}

          {(selectedType || selectedCollection || search) && (
            <button
              onClick={() => {
                setSelectedType("");
                setSelectedCollection("");
                setSearch("");
                setSelectedTag("");
              }}
              className="ml-auto text-xs font-mono text-[#D6A65C] hover:underline flex items-center space-x-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>
      </div>

      {/* Grid of Memory Cards */}
      {loading ? (
        <div className="py-20 text-center text-xs font-mono text-[#7A756D]">
          Searching archival chambers...
        </div>
      ) : memories.length === 0 ? (
        <div className="py-20 text-center rounded-xl border border-dashed border-[#282522] bg-[#121115] p-8">
          <Archive className="w-12 h-12 text-[#5A4A32] mx-auto mb-3" />
          <h3 className="font-serif text-lg text-[#E8E0D2] mb-1">No Relics Found</h3>
          <p className="text-xs text-[#9E988E] max-w-sm mx-auto mb-4 font-sans">
            No memories matched your search or filters. Try adjusting your query or ingest a new artifact.
          </p>
          <button
            onClick={() => setShowUploadModal(true)}
            className="px-4 py-2 text-xs font-mono rounded bg-[#D6A65C] text-[#0D0D0F] hover:bg-[#E5B771]"
          >
            Ingest First Artifact
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {memories.map((m) => (
            <MemoryCard key={m.id} memory={m} />
          ))}
        </div>
      )}

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

      {/* Manual Memory Modal */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-xl border border-[#3B3428] bg-[#121115] p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#25221E] pb-3 mb-4">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#D6A65C]">
                  Written Memoir
                </span>
                <h2 className="font-serif text-lg text-[#E8E0D2]">
                  Record Personal Recollection
                </h2>
              </div>
              <button
                onClick={() => setShowManualModal(false)}
                className="text-xs font-mono text-[#9E988E] hover:text-[#E8E0D2]"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleCreateManual} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-mono text-[#9E988E]">Title *</label>
                <input
                  type="text"
                  required
                  value={manualTitle}
                  onChange={(e) => setManualTitle(e.target.value)}
                  placeholder="e.g. The Night the Clock Stood Still"
                  className="w-full text-xs font-mono px-3 py-2 rounded bg-[#09090C] border border-[#282522] text-[#E8E0D2] focus:border-[#D6A65C] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-mono text-[#9E988E]">Date of Recollection</label>
                  <input
                    type="text"
                    value={manualDate}
                    onChange={(e) => setManualDate(e.target.value)}
                    placeholder="e.g. 2018-12-31"
                    className="w-full text-xs font-mono px-3 py-2 rounded bg-[#09090C] border border-[#282522] text-[#E8E0D2] focus:border-[#D6A65C] focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono text-[#9E988E]">Location</label>
                  <input
                    type="text"
                    value={manualLocation}
                    onChange={(e) => setManualLocation(e.target.value)}
                    placeholder="e.g. Old Harbor Cottage"
                    className="w-full text-xs font-mono px-3 py-2 rounded bg-[#09090C] border border-[#282522] text-[#E8E0D2] focus:border-[#D6A65C] focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono text-[#9E988E]">Collection</label>
                <select
                  value={manualColId}
                  onChange={(e) => setManualColId(e.target.value)}
                  className="w-full text-xs font-mono px-3 py-2 rounded bg-[#09090C] border border-[#282522] text-[#E8E0D2] focus:border-[#D6A65C] focus:outline-none"
                >
                  <option value="">No Collection Assigned</option>
                  {collections.map((col) => (
                    <option key={col.id} value={col.id}>
                      {col.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono text-[#9E988E]">Tags (comma separated)</label>
                <input
                  type="text"
                  value={manualTags}
                  onChange={(e) => setManualTags(e.target.value)}
                  placeholder="e.g. winter, blizzard, clocks, cottage"
                  className="w-full text-xs font-mono px-3 py-2 rounded bg-[#09090C] border border-[#282522] text-[#E8E0D2] focus:border-[#D6A65C] focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono text-[#9E988E]">The Recollection *</label>
                <textarea
                  required
                  rows={5}
                  value={manualDescription}
                  onChange={(e) => setManualDescription(e.target.value)}
                  placeholder="Write your story, memories, what you saw, felt, or heard..."
                  className="w-full text-xs font-sans px-3 py-2 rounded bg-[#09090C] border border-[#282522] text-[#E8E0D2] focus:border-[#D6A65C] focus:outline-none resize-none leading-relaxed"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  className="px-4 py-2 text-xs font-mono rounded border border-[#2C2925] text-[#9E988E] hover:text-[#E8E0D2]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingManual}
                  className="px-5 py-2 text-xs font-mono rounded bg-[#D6A65C] text-[#0D0D0F] hover:bg-[#E5B771] font-medium"
                >
                  {isSubmittingManual ? "Saving..." : "Save Recollection"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function VaultPage() {
  return (
    <Suspense fallback={<div className="p-8 text-xs font-mono text-[#7A756D]">Opening Vault...</div>}>
      <VaultContent />
    </Suspense>
  );
}
