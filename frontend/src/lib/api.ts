import {
  Memory,
  MemoryDetail,
  Collection,
  ConversationSession,
  ChatMessage,
  GhostStory,
  SystemStatus,
  StorageStats,
  TimelineData,
  ConnectionGraph,
} from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function fetchMemories(params?: {
  query?: string;
  memory_type?: string;
  collection_id?: string;
  tag?: string;
  person?: string;
  year?: number;
  limit?: number;
  offset?: number;
}): Promise<Memory[]> {
  const query = new URLSearchParams();
  if (params?.query) query.append("query", params.query);
  if (params?.memory_type) query.append("memory_type", params.memory_type);
  if (params?.collection_id) query.append("collection_id", params.collection_id);
  if (params?.tag) query.append("tag", params.tag);
  if (params?.person) query.append("person", params.person);
  if (params?.year) query.append("year", params.year.toString());
  if (params?.limit) query.append("limit", params.limit.toString());
  if (params?.offset) query.append("offset", params.offset.toString());

  const res = await fetch(`${API_BASE}/api/memories?${query.toString()}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch memories");
  return res.json();
}

export async function fetchForgottenMemories(limit = 6): Promise<Memory[]> {
  const res = await fetch(`${API_BASE}/api/memories/forgotten?limit=${limit}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch forgotten memories");
  return res.json();
}

export async function fetchMemoryDetail(id: string): Promise<MemoryDetail> {
  const res = await fetch(`${API_BASE}/api/memories/${id}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch memory details");
  return res.json();
}

export async function uploadMemory(formData: FormData): Promise<Memory> {
  const res = await fetch(`${API_BASE}/api/memories/upload`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Upload failed" }));
    throw new Error(err.detail || "Upload failed");
  }
  return res.json();
}

export async function createManualStory(data: {
  title: string;
  description: string;
  recorded_date?: string;
  location?: string;
  collection_id?: string;
  tags?: string[];
}): Promise<Memory> {
  const res = await fetch(`${API_BASE}/api/memories/manual`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...data, memory_type: "story" }),
  });
  if (!res.ok) throw new Error("Failed to create written memory");
  return res.json();
}

export async function updateMemory(id: string, data: Partial<Memory>): Promise<Memory> {
  const res = await fetch(`${API_BASE}/api/memories/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update memory");
  return res.json();
}

export async function deleteMemory(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/memories/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete memory");
}

export async function reprocessMemory(id: string): Promise<Memory> {
  const res = await fetch(`${API_BASE}/api/memories/${id}/reprocess`, { method: "POST" });
  if (!res.ok) throw new Error("Failed to reprocess memory");
  return res.json();
}

// Collections
export async function fetchCollections(): Promise<Collection[]> {
  const res = await fetch(`${API_BASE}/api/collections`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch collections");
  return res.json();
}

export async function createCollection(data: {
  name: string;
  description?: string;
  icon?: string;
  color?: string;
}): Promise<Collection> {
  const res = await fetch(`${API_BASE}/api/collections`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create collection");
  return res.json();
}

export async function deleteCollection(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/collections/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete collection");
}

// Ask the Archive (RAG)
export async function askArchive(
  message: string,
  sessionId?: string,
  collectionId?: string
): Promise<{ session_id: string; message: ChatMessage }> {
  const res = await fetch(`${API_BASE}/api/rag/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, session_id: sessionId, collection_id: collectionId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Inference query failed" }));
    throw new Error(err.detail || "Query failed");
  }
  return res.json();
}

export async function fetchSessions(): Promise<ConversationSession[]> {
  const res = await fetch(`${API_BASE}/api/rag/sessions`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch conversation sessions");
  return res.json();
}

export async function fetchSessionDetail(id: string): Promise<ConversationSession> {
  const res = await fetch(`${API_BASE}/api/rag/sessions/${id}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch session detail");
  return res.json();
}

export async function deleteSession(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/rag/sessions/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete session");
}

// Ghost Chamber
export async function generateGhostStory(data: {
  title?: string;
  memory_ids: string[];
  narrative_style: string;
  custom_prompt?: string;
  generate_narration?: boolean;
}): Promise<GhostStory> {
  const res = await fetch(`${API_BASE}/api/ghost/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Story generation failed" }));
    throw new Error(err.detail || "Story generation failed");
  }
  return res.json();
}

export async function fetchGhostStories(): Promise<GhostStory[]> {
  const res = await fetch(`${API_BASE}/api/ghost/stories`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch ghost stories");
  return res.json();
}

export async function fetchGhostStoryDetail(id: string): Promise<GhostStory> {
  const res = await fetch(`${API_BASE}/api/ghost/stories/${id}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch story");
  return res.json();
}

export async function deleteGhostStory(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/ghost/stories/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete story");
}

// Timeline
export async function fetchTimeline(params?: {
  person?: string;
  topic?: string;
  memory_type?: string;
}): Promise<TimelineData> {
  const query = new URLSearchParams();
  if (params?.person) query.append("person", params.person);
  if (params?.topic) query.append("topic", params.topic);
  if (params?.memory_type) query.append("memory_type", params.memory_type);

  const res = await fetch(`${API_BASE}/api/timeline?${query.toString()}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch timeline");
  return res.json();
}

export async function fetchMemoryConnections(): Promise<ConnectionGraph> {
  const res = await fetch(`${API_BASE}/api/timeline/connections`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch memory connections");
  return res.json();
}

// Settings & Storage
export async function fetchSystemStatus(): Promise<SystemStatus> {
  const res = await fetch(`${API_BASE}/api/settings/status`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch system status");
  return res.json();
}

export async function fetchStorageStats(): Promise<StorageStats> {
  const res = await fetch(`${API_BASE}/api/settings/storage`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch storage stats");
  return res.json();
}

export function getExportUrl(): string {
  return `${API_BASE}/api/settings/export`;
}

export async function wipeArchive(): Promise<void> {
  const res = await fetch(`${API_BASE}/api/settings/wipe`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to wipe archive");
}

export async function seedDemoArchive(force = false): Promise<void> {
  const res = await fetch(`${API_BASE}/api/demo/seed?force=${force}`, { method: "POST" });
  if (!res.ok) throw new Error("Failed to seed sample archive");
}

export async function resetDemoArchive(): Promise<void> {
  const res = await fetch(`${API_BASE}/api/demo/reset`, { method: "POST" });
  if (!res.ok) throw new Error("Failed to reset sample archive");
}

export function getFileUrl(fileRelativePath?: string): string {
  if (!fileRelativePath) return "";
  if (fileRelativePath.startsWith("http")) return fileRelativePath;
  return `${API_BASE}${fileRelativePath.startsWith("/") ? "" : "/"}${fileRelativePath}`;
}
