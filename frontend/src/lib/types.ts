export interface Tag {
  id: string;
  name: string;
}

export interface MemoryEntity {
  id: string;
  entity_type: string;
  entity_value: string;
}

export interface ProcessingLog {
  id: string;
  step_name: string;
  status: string;
  message?: string;
  created_at: string;
}

export interface Collection {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  created_at: string;
  memory_count?: number;
}

export interface Memory {
  id: string;
  title: string;
  description?: string;
  memory_type: "photo" | "audio" | "document" | "story";
  original_filename?: string;
  file_path?: string;
  mime_type?: string;
  file_size?: number;
  recorded_date?: string;
  recorded_year?: number;
  recorded_month?: number;
  location?: string;
  created_at: string;
  updated_at: string;
  last_accessed_at: string;
  access_count: number;
  ai_summary?: string;
  processing_status: "pending" | "processing" | "completed" | "failed";
  processing_error?: string;
  is_sample: boolean;
  collection_id?: string;
  collection_name?: string;
  tags: string[];
  entities: MemoryEntity[];
}

export interface MemoryDetail extends Memory {
  extracted_text?: string;
  technical_metadata?: Record<string, any>;
  logs: ProcessingLog[];
  related_memories: Memory[];
}

export interface SourceCitation {
  memory_id: string;
  title: string;
  memory_type: string;
  recorded_date?: string;
  similarity_score: number;
  snippet: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: SourceCitation[];
  created_at: string;
}

export interface ConversationSession {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  messages: ChatMessage[];
}

export interface GhostStory {
  id: string;
  title: string;
  narrative_style: string;
  prompt?: string;
  story_text: string;
  audio_path?: string;
  source_memory_ids: string[];
  disclaimer: string;
  is_sample: boolean;
  created_at: string;
}

export interface ModelStatus {
  name: string;
  category: string;
  provider: string;
  is_available: boolean;
  details?: string;
}

export interface SystemStatus {
  app_name: string;
  version: string;
  tagline: string;
  is_fully_offline: boolean;
  models: ModelStatus[];
  hardware_summary: {
    cpu_cores: number;
    cpu_usage_percent: number;
    ram_total_gb: number;
    ram_available_gb: number;
    ram_used_percent: number;
  };
}

export interface StorageStats {
  total_memories: number;
  photos_count: number;
  audio_count: number;
  documents_count: number;
  stories_count: number;
  total_file_size_bytes: number;
  database_size_bytes: number;
  storage_path: string;
}

export interface TimelineData {
  clusters: {
    year: number;
    count: number;
    months: Record<string, Memory[]>;
    memories: Memory[];
  }[];
  undated: Memory[];
  filter_options: {
    people: string[];
    topics: string[];
  };
}

export interface ConnectionGraph {
  nodes: {
    id: string;
    title: string;
    type: string;
    date?: string;
    collection?: string;
  }[];
  edges: {
    source: string;
    target: string;
    weight: number;
    reasons: string[];
  }[];
}
