"use client";

import React from "react";
import Link from "next/link";
import {
  Archive,
  Ghost,
  MessageSquareQuote,
  ShieldCheck,
  Cpu,
  Layers,
  Sparkles,
  ArrowRight,
  Clock,
  Mic,
  Image as ImageIcon,
  FileText,
  KeyRound,
  Eye,
  Lock
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="relative overflow-hidden">
      {/* Hero Section */}
      <section className="relative pt-20 pb-24 md:pt-32 md:pb-36 border-b border-[#22201D] overflow-hidden">
        {/* Atmospheric background glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-[#D6A65C]/8 rounded-full blur-[140px] pointer-events-none" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          {/* Hacktoberfest Badge */}
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full border border-[#4A3C2A] bg-[#161418] text-xs font-mono text-[#D6A65C] mb-8 shadow-sm">
            <Ghost className="w-3.5 h-3.5 animate-pulse text-[#D6A65C]" />
            <span>Hacktoberfest Open-Source AI Challenge — Week 4: Ghost in the Machine</span>
          </div>

          {/* Main Title */}
          <h1 className="font-serif text-4xl sm:text-6xl md:text-7xl font-normal tracking-tight text-[#E8E0D2] mb-6 leading-tight">
            The Memories That Refuse to Disappear
          </h1>

          {/* Tagline */}
          <p className="font-serif italic text-xl sm:text-2xl text-[#D6A65C] max-w-2xl mx-auto mb-8 font-light">
            "Some memories never leave. They just wait to be remembered."
          </p>

          <p className="text-sm sm:text-base text-[#9E988E] max-w-2xl mx-auto mb-10 leading-relaxed font-sans">
            An offline-first digital memory archive powered by open-weight AI models.
            Preserve, understand, and rediscover personal photographs, analog audio cassettes,
            and written recollections—entirely on your own hardware without a single byte sent to the cloud.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/dashboard"
              className="w-full sm:w-auto px-8 py-3.5 rounded-lg bg-[#D6A65C] text-[#0D0D0F] font-mono font-medium text-sm hover:bg-[#E5B771] flex items-center justify-center space-x-2 transition-all shadow-xl shadow-[#D6A65C]/15 group"
            >
              <span>Enter the Archive</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              href="/ghost-chamber"
              className="w-full sm:w-auto px-8 py-3.5 rounded-lg border border-[#5A4A32] bg-[#141318] text-[#E8E0D2] font-mono text-sm hover:border-[#D6A65C] hover:bg-[#1C1A20] flex items-center justify-center space-x-2 transition-all"
            >
              <Ghost className="w-4 h-4 text-[#D6A65C]" />
              <span>The Ghost Chamber</span>
            </Link>
          </div>

          {/* Key Trust Pillars */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto border-t border-[#22201D] pt-8 text-left">
            <div className="flex items-start space-x-2.5">
              <ShieldCheck className="w-4 h-4 text-[#7E8B68] flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-mono text-[#E8E0D2] uppercase tracking-wider">100% Local Privacy</h4>
                <p className="text-[11px] text-[#7A756D] font-mono mt-0.5">Memories stay on your machine</p>
              </div>
            </div>

            <div className="flex items-start space-x-2.5">
              <Cpu className="w-4 h-4 text-[#D6A65C] flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-mono text-[#E8E0D2] uppercase tracking-wider">Open Models</h4>
                <p className="text-[11px] text-[#7A756D] font-mono mt-0.5">Ollama, Whisper, Moondream</p>
              </div>
            </div>

            <div className="flex items-start space-x-2.5">
              <Lock className="w-4 h-4 text-[#5E81AC] flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-mono text-[#E8E0D2] uppercase tracking-wider">Zero Telemetry</h4>
                <p className="text-[11px] text-[#7A756D] font-mono mt-0.5">No cloud tracking or SaaS APIs</p>
              </div>
            </div>

            <div className="flex items-start space-x-2.5">
              <KeyRound className="w-4 h-4 text-[#B48EAD] flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-mono text-[#E8E0D2] uppercase tracking-wider">True Ownership</h4>
                <p className="text-[11px] text-[#7A756D] font-mono mt-0.5">Full ZIP export & permanent wipe</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Philosophy Section: Why Open-Source AI Matters */}
      <section className="py-20 border-b border-[#22201D] bg-[#0F0F13]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#D6A65C] block mb-2">
              The Manifesto
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl text-[#E8E0D2] mb-4">
              Why Open-Source AI Matters for Personal Memory
            </h2>
            <p className="text-sm text-[#9E988E] leading-relaxed font-sans">
              Commercial AI clouds demand that you surrender your most intimate family photographs,
              whispered voice notes, and private journals to remote corporate servers.
              EchoVault proves an uncompromising alternative is possible.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-lg border border-[#282520] bg-[#141418]">
              <div className="w-10 h-10 rounded-md border border-[#443828] bg-[#1C1814] flex items-center justify-center text-[#D6A65C] mb-4">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="font-serif text-lg text-[#E8E0D2] mb-2">Sanctuary of Silence</h3>
              <p className="text-xs text-[#9E988E] leading-relaxed">
                Your memories are not training data for multinational corporations. By running all inference locally via open-weight models, your private recollections never leave your physical storage.
              </p>
            </div>

            <div className="p-6 rounded-lg border border-[#282520] bg-[#141418]">
              <div className="w-10 h-10 rounded-md border border-[#304030] bg-[#151C15] flex items-center justify-center text-[#7E8B68] mb-4">
                <Cpu className="w-5 h-5" />
              </div>
              <h3 className="font-serif text-lg text-[#E8E0D2] mb-2">Decoupled Resilience</h3>
              <p className="text-xs text-[#9E988E] leading-relaxed">
                If the internet goes down, or an API service shuts down, your archive continues to function. You have perpetual access to your memories regardless of cloud provider whims.
              </p>
            </div>

            <div className="p-6 rounded-lg border border-[#282520] bg-[#141418]">
              <div className="w-10 h-10 rounded-md border border-[#403040] bg-[#1C141C] flex items-center justify-center text-[#B48EAD] mb-4">
                <Eye className="w-5 h-5" />
              </div>
              <h3 className="font-serif text-lg text-[#E8E0D2] mb-2">Total Transparency</h3>
              <p className="text-xs text-[#9E988E] leading-relaxed">
                EchoVault strictly distinguishes between raw historical evidence and AI-generated interpretations. When the archive lacks evidence, it states so honestly rather than inventing false history.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Core Features Preview */}
      <section className="py-20 border-b border-[#22201D]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#D6A65C] block mb-2">
              Archival Capabilities
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl text-[#E8E0D2] mb-4">
              An Abandoned Digital Archive Brought to Life
            </h2>
            <p className="text-sm text-[#9E988E]">
              Designed not as a generic SaaS dashboard, but as a mysterious digital repository of forgotten lore.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1: Memory Vault */}
            <Link
              href="/vault"
              className="group p-6 rounded-lg border border-[#282522] bg-[#131317] hover:border-[#5A4A32] hover:bg-[#181820] transition-all"
            >
              <div className="flex items-center justify-between mb-4">
                <Archive className="w-6 h-6 text-[#D6A65C]" />
                <span className="text-[10px] font-mono text-[#7A756D]">Vault Intake</span>
              </div>
              <h3 className="font-serif text-lg text-[#E8E0D2] group-hover:text-[#D6A65C] transition-colors mb-2">
                The Memory Vault
              </h3>
              <p className="text-xs text-[#9E988E] leading-relaxed mb-4">
                Upload photographs, audio recordings, scanned documents, or pen written stories. Organized into thematic collections with dates and locations.
              </p>
              <span className="text-xs font-mono text-[#D6A65C] flex items-center space-x-1">
                <span>Explore Vault</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
              </span>
            </Link>

            {/* Feature 2: Ask the Archive */}
            <Link
              href="/ask"
              className="group p-6 rounded-lg border border-[#282522] bg-[#131317] hover:border-[#5A4A32] hover:bg-[#181820] transition-all"
            >
              <div className="flex items-center justify-between mb-4">
                <MessageSquareQuote className="w-6 h-6 text-[#5E81AC]" />
                <span className="text-[10px] font-mono text-[#7A756D]">Local RAG</span>
              </div>
              <h3 className="font-serif text-lg text-[#E8E0D2] group-hover:text-[#5E81AC] transition-colors mb-2">
                Ask the Archive
              </h3>
              <p className="text-xs text-[#9E988E] leading-relaxed mb-4">
                Converse with your memories through local semantic vector retrieval. Every answer is strictly grounded in evidence and cites original source files.
              </p>
              <span className="text-xs font-mono text-[#5E81AC] flex items-center space-x-1">
                <span>Consult Records</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
              </span>
            </Link>

            {/* Feature 3: The Ghost Chamber */}
            <Link
              href="/ghost-chamber"
              className="group p-6 rounded-lg border border-[#4A3225] bg-[#171313] hover:border-[#D6A65C] hover:bg-[#1D1716] transition-all"
            >
              <div className="flex items-center justify-between mb-4">
                <Ghost className="w-6 h-6 text-[#D6A65C]" />
                <span className="text-[10px] font-mono text-[#D6A65C]">Ghost in the Machine</span>
              </div>
              <h3 className="font-serif text-lg text-[#E8E0D2] group-hover:text-[#D6A65C] transition-colors mb-2">
                The Ghost Chamber
              </h3>
              <p className="text-xs text-[#9E988E] leading-relaxed mb-4">
                Transform selected memories into haunting gothic stories, noir investigations, or first-person recollections with optional eerie audio narration.
              </p>
              <span className="text-xs font-mono text-[#D6A65C] flex items-center space-x-1">
                <span>Enter Chamber</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
              </span>
            </Link>

            {/* Feature 4: Memory Timeline */}
            <Link
              href="/timeline"
              className="group p-6 rounded-lg border border-[#282522] bg-[#131317] hover:border-[#5A4A32] hover:bg-[#181820] transition-all"
            >
              <div className="flex items-center justify-between mb-4">
                <Clock className="w-6 h-6 text-[#7E8B68]" />
                <span className="text-[10px] font-mono text-[#7A756D]">Chronology</span>
              </div>
              <h3 className="font-serif text-lg text-[#E8E0D2] group-hover:text-[#7E8B68] transition-colors mb-2">
                Memory Timeline
              </h3>
              <p className="text-xs text-[#9E988E] leading-relaxed mb-4">
                Chronological navigation across decades with monthly clusters, person/topic filters, and an interactive relationship graph connecting shared threads.
              </p>
              <span className="text-xs font-mono text-[#7E8B68] flex items-center space-x-1">
                <span>View Timeline</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
              </span>
            </Link>

            {/* Feature 5: The Forgotten Drawer */}
            <Link
              href="/forgotten-drawer"
              className="group p-6 rounded-lg border border-[#282522] bg-[#131317] hover:border-[#5A4A32] hover:bg-[#181820] transition-all"
            >
              <div className="flex items-center justify-between mb-4">
                <Layers className="w-6 h-6 text-[#B48EAD]" />
                <span className="text-[10px] font-mono text-[#7A756D]">Discovery</span>
              </div>
              <h3 className="font-serif text-lg text-[#E8E0D2] group-hover:text-[#B48EAD] transition-colors mb-2">
                The Forgotten Drawer
              </h3>
              <p className="text-xs text-[#9E988E] leading-relaxed mb-4">
                A discovery drawer surfacing memories that have not been opened in years, uncaptioned photographs, and untranscribed cassette ribbons.
              </p>
              <span className="text-xs font-mono text-[#B48EAD] flex items-center space-x-1">
                <span>Open Drawer</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
              </span>
            </Link>

            {/* Feature 6: Local AI Engine */}
            <Link
              href="/settings"
              className="group p-6 rounded-lg border border-[#282522] bg-[#131317] hover:border-[#5A4A32] hover:bg-[#181820] transition-all"
            >
              <div className="flex items-center justify-between mb-4">
                <Cpu className="w-6 h-6 text-[#D6A65C]" />
                <span className="text-[10px] font-mono text-[#7A756D]">Model Adapters</span>
              </div>
              <h3 className="font-serif text-lg text-[#E8E0D2] group-hover:text-[#D6A65C] transition-colors mb-2">
                Modular AI Stack
              </h3>
              <p className="text-xs text-[#9E988E] leading-relaxed mb-4">
                Inspect live model health (Qwen/Gemma, Nomic Embeddings, Moondream Vision, Faster-Whisper), storage metrics, and trigger full ZIP archive exports.
              </p>
              <span className="text-xs font-mono text-[#D6A65C] flex items-center space-x-1">
                <span>Inspect Stack</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-[#22201D] bg-[#0A0A0C]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-[#7A756D]">
          <div>
            <span className="text-[#E8E0D2] font-serif font-medium">EchoVault</span> — Week 4: Ghost in the Machine
          </div>
          <div>
            Open-Source AI Challenge • Hacktoberfest 2026
          </div>
          <div>
            Privacy-First • Local Inference • User Owned
          </div>
        </div>
      </footer>
    </div>
  );
}
