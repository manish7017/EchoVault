from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, ConfigDict

# Tag Schemas
class TagBase(BaseModel):
    name: str

class TagResponse(TagBase):
    id: str
    model_config = ConfigDict(from_attributes=True)

# Entity Schemas
class MemoryEntityResponse(BaseModel):
    id: str
    entity_type: str
    entity_value: str
    model_config = ConfigDict(from_attributes=True)

# Collection Schemas
class CollectionBase(BaseModel):
    name: str
    description: Optional[str] = None
    icon: Optional[str] = "folder-archive"
    color: Optional[str] = "#D6A65C"

class CollectionCreate(CollectionBase):
    pass

class CollectionResponse(CollectionBase):
    id: str
    created_at: datetime
    memory_count: Optional[int] = 0
    model_config = ConfigDict(from_attributes=True)

# Processing Log Schema
class ProcessingLogResponse(BaseModel):
    id: str
    step_name: str
    status: str
    message: Optional[str] = None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

# Memory Schemas
class MemoryBase(BaseModel):
    title: str
    description: Optional[str] = None
    memory_type: str # photo, audio, document, story
    recorded_date: Optional[str] = None
    location: Optional[str] = None
    collection_id: Optional[str] = None
    tags: Optional[List[str]] = []

class MemoryCreateManual(MemoryBase):
    pass

class MemoryUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    recorded_date: Optional[str] = None
    location: Optional[str] = None
    collection_id: Optional[str] = None
    tags: Optional[List[str]] = None

class MemoryResponse(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    memory_type: str
    original_filename: Optional[str] = None
    file_path: Optional[str] = None
    mime_type: Optional[str] = None
    file_size: Optional[int] = None
    recorded_date: Optional[str] = None
    recorded_year: Optional[int] = None
    recorded_month: Optional[int] = None
    location: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    last_accessed_at: datetime
    access_count: int
    ai_summary: Optional[str] = None
    processing_status: str
    processing_error: Optional[str] = None
    is_sample: bool
    collection_id: Optional[str] = None
    collection_name: Optional[str] = None
    tags: List[str] = []
    entities: List[MemoryEntityResponse] = []

    model_config = ConfigDict(from_attributes=True)

class MemoryDetailResponse(MemoryResponse):
    extracted_text: Optional[str] = None
    technical_metadata: Optional[Dict[str, Any]] = None
    logs: List[ProcessingLogResponse] = []
    related_memories: List[MemoryResponse] = []

class MemoryFilterParams(BaseModel):
    query: Optional[str] = None
    memory_type: Optional[str] = None
    collection_id: Optional[str] = None
    tag: Optional[str] = None
    person: Optional[str] = None
    year: Optional[int] = None
    limit: int = 50
    offset: int = 0
