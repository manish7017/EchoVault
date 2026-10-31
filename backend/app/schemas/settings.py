from typing import List, Dict, Any, Optional
from pydantic import BaseModel

class ModelStatus(BaseModel):
    name: str
    category: str # "llm", "embedding", "vision", "transcription", "tts"
    provider: str # "ollama", "faster-whisper", "edge-tts"
    is_available: bool
    details: Optional[str] = None

class SystemStatusResponse(BaseModel):
    app_name: str
    version: str
    tagline: str
    is_fully_offline: bool
    models: List[ModelStatus]
    hardware_summary: Dict[str, Any]

class StorageStatsResponse(BaseModel):
    total_memories: int
    photos_count: int
    audio_count: int
    documents_count: int
    stories_count: int
    total_file_size_bytes: int
    database_size_bytes: int
    storage_path: str

class PrivacyConfig(BaseModel):
    local_only_mode: bool = True
    allow_model_downloads: bool = True
    anonymize_exports: bool = False
