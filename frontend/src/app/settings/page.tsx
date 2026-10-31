"use client";

import React, { useState, useEffect } from "react";
import {
  Settings,
  Cpu,
  HardDrive,
  Download,
  Trash2,
  RefreshCw,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  FileArchive,
  Info,
  RotateCcw,
  Sparkles,
  Lock
} from "lucide-react";
import {
  fetchSystemStatus,
  fetchStorageStats,
  getExportUrl,
  wipeArchive,
  seedDemoArchive,
  resetDemoArchive
} from "@/lib/api";
import { SystemStatus, StorageStats } from "@/lib/types";
import { formatBytes } from "@/lib/utils";

export default function SettingsPage() {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [storage, setStorage] = useState<StorageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const loadSettingsData = async () => {
    try {
      setLoading(true);
      const [st, stor] = await Promise.all([
        fetchSystemStatus(),
        fetchStorageStats()
      ]);
      setStatus(st);
      setStorage(stor);
    } catch (err) {
      console.error("Settings data fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettingsData();
  }, []);

  const handleWipe = async () => {
    if (!confirm("CRITICAL WARNING: This will permanently delete all memories, audio recordings, photographs, and database records from your local storage. Proceed?")) return;
    try {
      await wipeArchive();
      setActionMessage("Archive permanently wiped.");
      loadSettingsData();
    } catch (err: any) {
      alert("Wipe failed: " + err.message);
    }
  };

  const handleResetSample = async () => {
    if (!confirm("This will reset your local archive back to the default fictional sample memories. Continue?")) return;
    try {
      await resetDemoArchive();
      setActionMessage("Archive successfully reset to default fictional memories.");
      loadSettingsData();
    } catch (err: any) {
      alert("Reset failed: " + err.message);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-10">
      {/* Header */}
      <div className="border-b border-[#25221E] pb-6 space-y-2">
        <span className="text-[10px] font-mono uppercase tracking-widest text-[#D6A65C] block">
          System Administration
        </span>
        <h1 className="font-serif text-3xl text-[#E8E0D2] font-normal">
          Archive Settings & Open AI Stack
        </h1>
        <p className="text-xs text-[#9E988E] font-mono">
          Model adapters, offline status, physical storage metrics, and data ownership controls.
        </p>
      </div>

      {actionMessage && (
        <div className="p-3.5 rounded-lg border border-[#5A4A32] bg-[#1A1814] text-xs font-mono text-[#D6A65C] flex items-center justify-between">
          <span>{actionMessage}</span>
          <button onClick={() => setActionMessage(null)} className="underline ml-4">
            Dismiss
          </button>
        </div>
      )}

      {/* 1. Open-Source AI Model Infrastructure */}
      <section className="rounded-xl border border-[#282522] bg-[#121115] p-6 space-y-5 shadow-xl">
        <div className="flex items-center justify-between border-b border-[#22201D] pb-3">
          <div className="flex items-center space-x-2.5 text-[#D6A65C]">
            <Cpu className="w-5 h-5" />
            <h2 className="font-serif text-base text-[#E8E0D2] font-medium">
              Open-Weight AI Model Adapters
            </h2>
          </div>
          <button
            onClick={loadSettingsData}
            title="Refresh model health"
            className="p-1 rounded text-[#9E988E] hover:text-[#E8E0D2]"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {status?.models?.map((m) => (
            <div
              key={m.name}
              className="p-4 rounded-lg border border-[#242220] bg-[#16151B] flex items-start justify-between space-x-3"
            >
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-mono uppercase tracking-wide px-1.5 py-0.5 rounded border border-[#3A3224] bg-[#1A1813] text-[#D6A65C]">
                    {m.category}
                  </span>
                  <span className="text-xs font-mono text-[#E8E0D2] font-semibold">{m.name}</span>
                </div>
                <p className="text-[11px] font-mono text-[#7A756D] mt-1.5">
                  Provider: <span className="text-[#9E988E]">{m.provider}</span>
                </p>
                {m.details && (
                  <p className="text-[10px] font-mono text-[#7A756D] mt-0.5">{m.details}</p>
                )}
              </div>

              <div>
                {m.is_available ? (
                  <span className="inline-flex items-center space-x-1 text-[11px] font-mono text-[#7E8B68]">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Active</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center space-x-1 text-[11px] font-mono text-red-400">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Missing</span>
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Hardware Status */}
        {status?.hardware_summary && (
          <div className="pt-4 border-t border-[#22201D] grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono text-[#7A756D]">
            <div>
              <span className="block text-[10px] uppercase">CPU Cores</span>
              <span className="text-[#E8E0D2]">{status.hardware_summary.cpu_cores} Logical Cores</span>
            </div>
            <div>
              <span className="block text-[10px] uppercase">RAM Total</span>
              <span className="text-[#E8E0D2]">{status.hardware_summary.ram_total_gb} GB</span>
            </div>
            <div>
              <span className="block text-[10px] uppercase">RAM Available</span>
              <span className="text-[#7E8B68]">{status.hardware_summary.ram_available_gb} GB free</span>
            </div>
            <div>
              <span className="block text-[10px] uppercase">Inference Mode</span>
              <span className="text-[#D6A65C]">100% Offline / Local</span>
            </div>
          </div>
        )}
      </section>

      {/* 2. Physical Storage & Memory Counts */}
      <section className="rounded-xl border border-[#282522] bg-[#121115] p-6 space-y-5 shadow-xl">
        <div className="flex items-center space-x-2.5 text-[#5E81AC] border-b border-[#22201D] pb-3">
          <HardDrive className="w-5 h-5" />
          <h2 className="font-serif text-base text-[#E8E0D2] font-medium">
            Physical Storage & Relic Counts
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-3 rounded border border-[#22201D] bg-[#16151B]">
            <span className="text-[10px] font-mono text-[#7A756D] uppercase block">Total Memories</span>
            <span className="font-serif text-xl text-[#E8E0D2]">{storage?.total_memories ?? 0}</span>
          </div>
          <div className="p-3 rounded border border-[#22201D] bg-[#16151B]">
            <span className="text-[10px] font-mono text-[#7A756D] uppercase block">Media Files Size</span>
            <span className="font-serif text-xl text-[#E8E0D2]">{formatBytes(storage?.total_file_size_bytes)}</span>
          </div>
          <div className="p-3 rounded border border-[#22201D] bg-[#16151B]">
            <span className="text-[10px] font-mono text-[#7A756D] uppercase block">Database Size</span>
            <span className="font-serif text-xl text-[#E8E0D2]">{formatBytes(storage?.database_size_bytes)}</span>
          </div>
          <div className="p-3 rounded border border-[#22201D] bg-[#16151B]">
            <span className="text-[10px] font-mono text-[#7A756D] uppercase block">Storage Directory</span>
            <span className="text-[10px] font-mono text-[#9E988E] truncate block mt-1" title={storage?.storage_path}>
              {storage?.storage_path ? ".../" + storage.storage_path.split("/").slice(-2).join("/") : "Local"}
            </span>
          </div>
        </div>
      </section>

      {/* 3. Privacy & Telemetry Guarantee */}
      <section className="rounded-xl border border-[#36422C] bg-[#131713] p-6 space-y-3">
        <div className="flex items-center space-x-2 text-[#7E8B68]">
          <ShieldCheck className="w-5 h-5" />
          <h2 className="font-serif text-base text-[#E8E0D2] font-medium">
            Privacy & Telemetry Guarantee
          </h2>
        </div>
        <p className="text-xs text-[#9E988E] font-sans leading-relaxed">
          EchoVault sends zero telemetry, diagnostics, or personal content to any remote server.
          Embeddings, vector searches, vision analysis, and audio transcriptions execute exclusively on your host CPU/GPU.
          Your digital memories are yours alone.
        </p>
      </section>

      {/* 4. Ownership, Export & Purge Actions */}
      <section className="rounded-xl border border-[#282522] bg-[#121115] p-6 space-y-5">
        <h2 className="font-serif text-base text-[#E8E0D2] border-b border-[#22201D] pb-3 font-medium">
          Data Ownership & Danger Zone
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Download Export */}
          <a
            href={getExportUrl()}
            download
            className="p-4 rounded-lg border border-[#3E3830] bg-[#16151B] hover:border-[#D6A65C] hover:bg-[#1C1814] transition-all flex flex-col justify-between group"
          >
            <div>
              <Download className="w-5 h-5 text-[#D6A65C] mb-2" />
              <h3 className="text-xs font-mono text-[#E8E0D2] font-semibold mb-1">
                Export Full Archive (.ZIP)
              </h3>
              <p className="text-[11px] text-[#7A756D] leading-tight">
                Download a self-contained ZIP containing JSON metadata, Markdown catalog, and all original media.
              </p>
            </div>
            <span className="text-xs font-mono text-[#D6A65C] mt-4 flex items-center space-x-1 group-hover:underline">
              <span>Download ZIP</span>
            </span>
          </a>

          {/* Reset Demo Memories */}
          <button
            onClick={handleResetSample}
            className="p-4 rounded-lg border border-[#3E3830] bg-[#16151B] hover:border-[#D6A65C] hover:bg-[#1C1814] text-left transition-all flex flex-col justify-between group"
          >
            <div>
              <RotateCcw className="w-5 h-5 text-[#7E8B68] mb-2" />
              <h3 className="text-xs font-mono text-[#E8E0D2] font-semibold mb-1">
                Reset Sample Archive
              </h3>
              <p className="text-[11px] text-[#7A756D] leading-tight">
                Restore the default fictional Halloween 1988 Blackwood Manor sample records for testing and demonstration.
              </p>
            </div>
            <span className="text-xs font-mono text-[#7E8B68] mt-4 flex items-center space-x-1 group-hover:underline">
              <span>Reset Samples</span>
            </span>
          </button>

          {/* Permanently Wipe */}
          <button
            onClick={handleWipe}
            className="p-4 rounded-lg border border-red-900/40 bg-red-950/20 hover:border-red-600 hover:bg-red-950/30 text-left transition-all flex flex-col justify-between group"
          >
            <div>
              <Trash2 className="w-5 h-5 text-red-400 mb-2" />
              <h3 className="text-xs font-mono text-red-300 font-semibold mb-1">
                Wipe Entire Archive
              </h3>
              <p className="text-[11px] text-[#7A756D] leading-tight">
                Permanently purge all memories, audio cassettes, images, embeddings, and database tables.
              </p>
            </div>
            <span className="text-xs font-mono text-red-400 mt-4 flex items-center space-x-1 group-hover:underline">
              <span>Permanent Purge</span>
            </span>
          </button>
        </div>
      </section>
    </div>
  );
}
