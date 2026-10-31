"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Ghost,
  Sparkles,
  Volume2,
  BookOpen,
  Calendar,
  Layers,
  ArrowRight,
  Loader2,
  Check,
  AlertCircle,
  FileText,
  Mic,
  Image as ImageIcon,
  History,
  RotateCcw
} from "lucide-react";
import { fetchMemories, generateGhostStory, fetchGhostStories, getFileUrl } from "@/lib/api";
import { Memory, GhostStory } from "@/lib/types";
import AudioPlayer from "@/components/AudioPlayer";

const NARRATIVE_STYLES = [
  {
    id: "haunted_gothic",
    title: "Haunted Gothic",
    description: "Atmospheric, shadowy, and poetic gothic folklore weaving real relics into melancholy legend.",
    accent: "text-[#D6A65C] border-[#5A4A32] bg-[#1E1B15]"
  },
  {
    id: "mysterious_noir",
    title: "Mysterious Noir",
    description: "Cold archival detective investigation piecing together timestamps, strange anomalies, and clues.",
    accent: "text-[#5E81AC] border-[#344458] bg-[#141A24]"
  },
  {
    id: "first_person_echo",
    title: "First-Person Echo",
    description: "Recollection spoken from the viewpoint of an unplayed tape ribbon or faded photograph.",
    accent: "text-[#B48EAD] border-[#4A3245] bg-[#1C141C]"
  },
  {
    id: "chronological_reconstruction",
    title: "Chronological Reconstruction",
    description: "Piece-by-piece timeline recounting the sequence of events and the strange pauses between them.",
    accent: "text-[#7E8B68] border-[#36422C] bg-[#151C13]"
  }
];

export default function GhostChamberPage() {
  const [availableMemories, setAvailableMemories] = useState<Memory[]>([]);
  const [selectedMemoryIds, setSelectedMemoryIds] = useState<string[]>([]);
  const [selectedStyle, setSelectedStyle] = useState<string>("haunted_gothic");
  const [customPrompt, setCustomPrompt] = useState("");
  const [generateNarration, setGenerateNarration] = useState(true);

  const [activeStory, setActiveStory] = useState<GhostStory | null>(null);
  const [pastStories, setPastStories] = useState<GhostStory[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMemories({ limit: 50 }).then((data) => {
      setAvailableMemories(data);
      // Pre-select first 2-3 memories if available
      if (data.length > 0) {
        setSelectedMemoryIds(data.slice(0, 2).map((m) => m.id));
      }
    });

    fetchGhostStories().then((stories) => {
      setPastStories(stories);
      if (stories.length > 0) {
        setActiveStory(stories[0]);
      }
    });
  }, []);

  const toggleMemorySelection = (id: string) => {
    setSelectedMemoryIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleGenerateStory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedMemoryIds.length === 0) {
      setError("Please select at least one memory to inspire the narrative.");
      return;
    }

    try {
      setIsGenerating(true);
      setError(null);
      const story = await generateGhostStory({
        memory_ids: selectedMemoryIds,
        narrative_style: selectedStyle,
        custom_prompt: customPrompt.trim() || undefined,
        generate_narration: generateNarration
      });
      setActiveStory(story);
      setPastStories([story, ...pastStories]);
    } catch (err: any) {
      setError(err.message || "Failed to generate story in the Ghost Chamber.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-10">
      {/* Ghost Chamber Header */}
      <div className="border-b border-[#25221E] pb-6 text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full border border-[#5A4A32] bg-[#161418] text-xs font-mono text-[#D6A65C]">
          <Ghost className="w-4 h-4 text-[#D6A65C] animate-pulse" />
          <span>Hacktoberfest Week 4: Ghost in the Machine</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-5xl text-[#E8E0D2] font-normal tracking-tight">
          The Ghost Chamber
        </h1>
        <p className="font-serif italic text-base sm:text-lg text-[#D6A65C]">
          "What if the memories we almost forgot could still tell us their stories?"
        </p>
        <p className="text-xs text-[#9E988E] max-w-xl mx-auto font-sans leading-relaxed">
          Select genuine artifacts from your archive. The Chamber will weave their dates, voices, and photographs into atmospheric literary narratives.
        </p>
      </div>

      {/* Main Grid: Story Generator on Left, Story Reader on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column (5 cols): Story Crafting Chamber */}
        <div className="lg:col-span-5 space-y-6">
          <form onSubmit={handleGenerateStory} className="rounded-xl border border-[#3B3428] bg-[#131217] p-6 shadow-2xl space-y-6">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#D6A65C] block mb-1">
                Step 1: Select Source Memories
              </span>
              <h3 className="font-serif text-base text-[#E8E0D2]">
                Artifacts to Summon ({selectedMemoryIds.length} selected)
              </h3>
            </div>

            {/* Memory selection list */}
            <div className="max-h-56 overflow-y-auto space-y-2 pr-1 border border-[#25221E] p-2 rounded-lg bg-[#0A0A0C]">
              {availableMemories.map((m) => {
                const isSelected = selectedMemoryIds.includes(m.id);
                return (
                  <div
                    key={m.id}
                    onClick={() => toggleMemorySelection(m.id)}
                    className={`p-2.5 rounded text-xs font-mono flex items-center justify-between cursor-pointer transition-all ${
                      isSelected
                        ? "bg-[#201D17] border border-[#5A4A32] text-[#E8E0D2]"
                        : "bg-[#111115] border border-[#201E1C] text-[#9E988E] hover:border-[#3E3830]"
                    }`}
                  >
                    <div className="flex items-center space-x-2 truncate">
                      <div className={`w-4 h-4 rounded flex items-center justify-center border ${isSelected ? "border-[#D6A65C] bg-[#D6A65C] text-[#0D0D0F]" : "border-[#3E3830]"}`}>
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                      <span className="truncate">{m.title}</span>
                    </div>
                    <span className="text-[10px] text-[#7A756D] flex-shrink-0 ml-2">
                      {m.recorded_date || m.memory_type}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Step 2: Choose Narrative Style */}
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#D6A65C] block mb-2">
                Step 2: Choose Narrative Style
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {NARRATIVE_STYLES.map((style) => (
                  <button
                    key={style.id}
                    type="button"
                    onClick={() => setSelectedStyle(style.id)}
                    className={`p-3 rounded-lg text-left transition-all border ${
                      selectedStyle === style.id
                        ? `${style.accent} border-[#D6A65C] shadow-sm`
                        : "border-[#25221E] bg-[#0E0E12] text-[#9E988E] hover:border-[#3E3830]"
                    }`}
                  >
                    <div className="font-serif text-xs font-medium text-[#E8E0D2] mb-1">
                      {style.title}
                    </div>
                    <p className="text-[10px] text-[#7A756D] line-clamp-2 leading-tight">
                      {style.description}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Step 3: Custom Story Direction */}
            <div className="space-y-1">
              <label className="text-xs font-mono text-[#9E988E]">Optional Narrative Focus</label>
              <input
                type="text"
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="e.g. Focus on the cold wind and the unplayed cassette..."
                className="w-full text-xs font-mono px-3 py-2 rounded bg-[#0A0A0C] border border-[#282522] text-[#E8E0D2] focus:border-[#D6A65C] focus:outline-none"
              />
            </div>

            {/* Toggle Narration */}
            <div className="flex items-center justify-between p-3 rounded-lg border border-[#25221E] bg-[#0E0E12]">
              <div className="flex items-center space-x-2">
                <Volume2 className="w-4 h-4 text-[#D6A65C]" />
                <span className="text-xs font-mono text-[#E8E0D2]">Synthesize Audio Narration</span>
              </div>
              <input
                type="checkbox"
                checked={generateNarration}
                onChange={(e) => setGenerateNarration(e.target.checked)}
                className="w-4 h-4 accent-[#D6A65C] cursor-pointer"
              />
            </div>

            {error && (
              <div className="p-3 rounded border border-red-900/40 bg-red-950/20 text-xs text-red-300 flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Generate Button */}
            <button
              type="submit"
              disabled={isGenerating || selectedMemoryIds.length === 0}
              className="w-full py-3 px-4 rounded-lg bg-[#D6A65C] text-[#0D0D0F] font-mono text-xs font-medium hover:bg-[#E5B771] disabled:opacity-50 flex items-center justify-center space-x-2 transition-all shadow-xl shadow-[#D6A65C]/15"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Chamber Weaving Tale...</span>
                </>
              ) : (
                <>
                  <Ghost className="w-4 h-4" />
                  <span>Summon Narrative</span>
                </>
              )}
            </button>
          </form>

          {/* Past Chamber Stories List */}
          {pastStories.length > 0 && (
            <div className="rounded-xl border border-[#282522] bg-[#121115] p-5 space-y-3">
              <div className="flex items-center space-x-2 border-b border-[#22201D] pb-2 text-[#D6A65C]">
                <History className="w-4 h-4" />
                <h3 className="font-serif text-xs uppercase tracking-wider font-semibold">
                  Archived Chamber Narratives
                </h3>
              </div>

              <div className="space-y-2">
                {pastStories.map((story) => (
                  <button
                    key={story.id}
                    onClick={() => setActiveStory(story)}
                    className={`w-full text-left p-2.5 rounded text-xs font-mono flex items-center justify-between transition-colors ${
                      activeStory?.id === story.id
                        ? "bg-[#201D17] border border-[#5A4A32] text-[#D6A65C]"
                        : "bg-[#0E0E12] border border-[#22201D] text-[#9E988E] hover:text-[#E8E0D2]"
                    }`}
                  >
                    <span className="truncate max-w-[200px]">{story.title}</span>
                    <span className="text-[10px] text-[#7A756D]">{story.narrative_style}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column (7 cols): The Story Reader */}
        <div className="lg:col-span-7">
          {activeStory ? (
            <div className="rounded-xl border border-[#443828] bg-[#111014] p-8 shadow-2xl space-y-6 relative overflow-hidden">
              {/* Story Header */}
              <div className="border-b border-[#2A2620] pb-5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-[#5A4A32] bg-[#1E1B15] text-[#D6A65C] uppercase tracking-wider">
                    {activeStory.narrative_style.replace(/_/g, " ")}
                  </span>
                  {activeStory.is_sample && (
                    <span className="text-[10px] font-mono text-[#D6A65C]">Sample Tale</span>
                  )}
                </div>

                <h2 className="font-serif text-2xl sm:text-3xl text-[#E8E0D2] font-normal leading-tight">
                  {activeStory.title}
                </h2>
              </div>

              {/* Optional Audio Narration Player */}
              {activeStory.audio_path && (
                <div className="pt-1">
                  <AudioPlayer
                    src={getFileUrl(activeStory.audio_path)}
                    title={`Narration: ${activeStory.title}`}
                    subtext="Chamber Voice Narration"
                  />
                </div>
              )}

              {/* Story Prose */}
              <div className="prose prose-invert max-w-none text-sm text-[#E8E0D2] font-serif leading-relaxed whitespace-pre-wrap space-y-4 pt-2">
                {activeStory.story_text}
              </div>

              {/* Strict Ethical Transparency Disclaimer */}
              <div className="pt-6 border-t border-[#25221E] text-[11px] font-mono text-[#7A756D] flex items-start space-x-2 bg-[#0A0A0C]/50 p-3.5 rounded-lg border border-[#22201D]">
                <BookOpen className="w-4 h-4 text-[#5A4A32] flex-shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  <strong className="text-[#9E988E]">Ethical Archival Disclaimer:</strong>{" "}
                  {activeStory.disclaimer}
                </p>
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center rounded-xl border border-dashed border-[#282522] bg-[#111014] p-8 text-center text-xs font-mono text-[#7A756D] space-y-3">
              <Ghost className="w-12 h-12 text-[#3B3428]" />
              <p>Select memories on the left to summon a tale from the Chamber.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
