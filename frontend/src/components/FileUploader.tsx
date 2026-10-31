"use client";

import React, { useState, useRef } from "react";
import { UploadCloud, Image as ImageIcon, Mic, FileText, X, Check, AlertCircle, Loader2 } from "lucide-react";
import { uploadMemory } from "@/lib/api";
import { Collection, Memory } from "@/lib/types";

interface FileUploaderProps {
  collections: Collection[];
  onUploadSuccess?: (memory: Memory) => void;
  onClose?: () => void;
}

export default function FileUploader({ collections, onUploadSuccess, onClose }: FileUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [recordedDate, setRecordedDate] = useState("");
  const [location, setLocation] = useState("");
  const [collectionId, setCollectionId] = useState("");
  const [tags, setTags] = useState("");
  
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
    setError(null);

    // Auto-fill title if empty
    if (!title) {
      const cleanName = selectedFile.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
      setTitle(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
    }

    // Generate preview for images
    if (selectedFile.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => setFilePreview(e.target?.result as string);
      reader.readAsDataURL(selectedFile);
    } else {
      setFilePreview(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError("Please select a file to archive.");
      return;
    }
    if (!title.trim()) {
      setError("Archival title is required.");
      return;
    }

    try {
      setIsUploading(true);
      setError(null);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", title.trim());
      if (description) formData.append("description", description.trim());
      if (recordedDate) formData.append("recorded_date", recordedDate.trim());
      if (location) formData.append("location", location.trim());
      if (collectionId) formData.append("collection_id", collectionId);
      if (tags) formData.append("tags", tags.trim());

      const createdMemory = await uploadMemory(formData);
      setIsUploading(false);
      if (onUploadSuccess) onUploadSuccess(createdMemory);
      if (onClose) onClose();
    } catch (err: any) {
      setIsUploading(false);
      setError(err.message || "Failed to upload file to archive");
    }
  };

  const getFileCategoryIcon = () => {
    if (!file) return UploadCloud;
    if (file.type.startsWith("image/")) return ImageIcon;
    if (file.type.startsWith("audio/")) return Mic;
    return FileText;
  };

  const FileIcon = getFileCategoryIcon();

  return (
    <div className="rounded-xl border border-[#3B3428] bg-[#121115] p-6 shadow-2xl relative">
      <div className="flex items-center justify-between border-b border-[#25221E] pb-4 mb-5">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-[#D6A65C]">
            Archival Intake
          </span>
          <h2 className="font-serif text-lg text-[#E8E0D2] font-medium">
            Ingest Artifact into Vault
          </h2>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 rounded text-[#9E988E] hover:text-[#E8E0D2] hover:bg-[#1C1814]"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {error && (
        <div className="mb-5 p-3 rounded border border-red-900/40 bg-red-950/20 flex items-center space-x-2 text-xs text-red-300">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Dropzone */}
        {!file ? (
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all ${
              isDragging
                ? "border-[#D6A65C] bg-[#D6A65C]/5"
                : "border-[#302B24] hover:border-[#5A4A32] bg-[#0E0E12]"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
            />
            <UploadCloud className="w-10 h-10 mx-auto mb-3 text-[#5A4A32]" />
            <p className="text-sm text-[#E8E0D2] font-medium mb-1">
              Drop an artifact here, or click to browse
            </p>
            <p className="text-xs text-[#7A756D] font-mono">
              Photographs (JPG, PNG, WebP), Audio (MP3, WAV, M4A, OGG), Documents (PDF, TXT)
            </p>
          </div>
        ) : (
          <div className="flex items-center justify-between p-3 rounded border border-[#383226] bg-[#16151B]">
            <div className="flex items-center space-x-3 truncate">
              {filePreview ? (
                <img
                  src={filePreview}
                  alt="Preview"
                  className="w-12 h-12 object-cover rounded border border-[#443C2E]"
                />
              ) : (
                <div className="w-12 h-12 rounded border border-[#443C2E] bg-[#1E1C1A] flex items-center justify-center text-[#D6A65C]">
                  <FileIcon className="w-6 h-6" />
                </div>
              )}
              <div className="truncate">
                <p className="text-xs font-mono text-[#E8E0D2] truncate">{file.name}</p>
                <p className="text-[11px] font-mono text-[#7A756D]">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => { setFile(null); setFilePreview(null); }}
              className="p-1 rounded text-[#9E988E] hover:text-red-400 hover:bg-[#201D19]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Metadata Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-mono text-[#9E988E]">Archival Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. October 1988 Key In Attic"
              className="w-full text-xs font-mono px-3 py-2 rounded bg-[#0A0A0C] border border-[#2C2925] text-[#E8E0D2] focus:border-[#D6A65C] focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-mono text-[#9E988E]">Recorded Date</label>
            <input
              type="text"
              value={recordedDate}
              onChange={(e) => setRecordedDate(e.target.value)}
              placeholder="e.g. 1994-12-14 or Winter 1988"
              className="w-full text-xs font-mono px-3 py-2 rounded bg-[#0A0A0C] border border-[#2C2925] text-[#E8E0D2] focus:border-[#D6A65C] focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-mono text-[#9E988E]">Location</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Blackwood Study or North Pier"
              className="w-full text-xs font-mono px-3 py-2 rounded bg-[#0A0A0C] border border-[#2C2925] text-[#E8E0D2] focus:border-[#D6A65C] focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-mono text-[#9E988E]">Collection</label>
            <select
              value={collectionId}
              onChange={(e) => setCollectionId(e.target.value)}
              className="w-full text-xs font-mono px-3 py-2 rounded bg-[#0A0A0C] border border-[#2C2925] text-[#E8E0D2] focus:border-[#D6A65C] focus:outline-none"
            >
              <option value="">No Collection Assigned</option>
              {collections.map((col) => (
                <option key={col.id} value={col.id}>
                  {col.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-mono text-[#9E988E]">Tags (comma separated)</label>
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="e.g. cassette, attic, rain, nostalgia"
            className="w-full text-xs font-mono px-3 py-2 rounded bg-[#0A0A0C] border border-[#2C2925] text-[#E8E0D2] focus:border-[#D6A65C] focus:outline-none"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-mono text-[#9E988E]">Personal Recollection / Notes</label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What does this memory mean? Who was there? What was happening?"
            className="w-full text-xs font-sans px-3 py-2 rounded bg-[#0A0A0C] border border-[#2C2925] text-[#E8E0D2] focus:border-[#D6A65C] focus:outline-none resize-none leading-relaxed"
          />
        </div>

        {/* Submit button */}
        <div className="pt-2 flex justify-end space-x-3">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              disabled={isUploading}
              className="px-4 py-2 text-xs font-mono rounded border border-[#2C2925] text-[#9E988E] hover:text-[#E8E0D2] hover:bg-[#1A1816]"
            >
              Cancel
            </button>
          )}

          <button
            type="submit"
            disabled={isUploading || !file}
            className="px-5 py-2 text-xs font-mono font-medium rounded bg-[#D6A65C] text-[#0D0D0F] hover:bg-[#E5B771] disabled:opacity-50 flex items-center space-x-2 transition-colors shadow-lg shadow-[#D6A65C]/15"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Archiving & Indexing...</span>
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Ingest Memory</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
