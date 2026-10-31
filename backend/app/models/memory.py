import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column, String, Text, Integer, Float, Boolean, DateTime, ForeignKey, Table, JSON
)
from sqlalchemy.orm import relationship
from app.database import Base

def generate_uuid() -> str:
    return str(uuid.uuid4())

# Association table for Many-to-Many Memory <-> Tag
memory_tags = Table(
    "memory_tags",
    Base.metadata,
    Column("memory_id", String, ForeignKey("memories.id", ondelete="CASCADE"), primary_key=True),
    Column("tag_id", String, ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True)
)

class Collection(Base):
    __tablename__ = "collections"

    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, nullable=False, unique=True, index=True)
    description = Column(Text, nullable=True)
    icon = Column(String, nullable=True, default="folder-archive")
    color = Column(String, nullable=True, default="#D6A65C")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    memories = relationship("Memory", back_populates="collection", cascade="all, delete-orphan")

class Tag(Base):
    __tablename__ = "tags"

    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, nullable=False, unique=True, index=True)

    memories = relationship("Memory", secondary=memory_tags, back_populates="tags")

class Memory(Base):
    __tablename__ = "memories"

    id = Column(String, primary_key=True, default=generate_uuid)
    title = Column(String, nullable=False, index=True)
    description = Column(Text, nullable=True) # User-provided notes or written recollection
    memory_type = Column(String, nullable=False, index=True) # photo, audio, document, story
    
    original_filename = Column(String, nullable=True)
    file_path = Column(String, nullable=True)
    mime_type = Column(String, nullable=True)
    file_size = Column(Integer, nullable=True) # In bytes
    
    recorded_date = Column(String, nullable=True, index=True) # E.g. "1988-10-31", "Winter 2018"
    recorded_year = Column(Integer, nullable=True, index=True) # E.g. 1988
    recorded_month = Column(Integer, nullable=True, index=True) # E.g. 10
    location = Column(String, nullable=True, index=True)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    last_accessed_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    access_count = Column(Integer, default=0)
    
    # AI Understanding Fields
    extracted_text = Column(Text, nullable=True) # Transcribed audio, vision analysis, or document text
    ai_summary = Column(Text, nullable=True) # Concise AI summary
    processing_status = Column(String, default="pending", index=True) # pending, processing, completed, failed
    processing_error = Column(Text, nullable=True)
    technical_metadata = Column(JSON, nullable=True) # EXIF, audio bitrate/duration, OCR stats
    
    # Ownership & Flags
    is_sample = Column(Boolean, default=False, index=True) # Sample fictional demo memory
    collection_id = Column(String, ForeignKey("collections.id", ondelete="SET NULL"), nullable=True)

    # Relationships
    collection = relationship("Collection", back_populates="memories")
    tags = relationship("Tag", secondary=memory_tags, back_populates="memories")
    entities = relationship("MemoryEntity", back_populates="memory", cascade="all, delete-orphan")
    embeddings = relationship("MemoryEmbedding", back_populates="memory", cascade="all, delete-orphan")
    logs = relationship("ProcessingLog", back_populates="memory", cascade="all, delete-orphan")

class MemoryEntity(Base):
    __tablename__ = "memory_entities"

    id = Column(String, primary_key=True, default=generate_uuid)
    memory_id = Column(String, ForeignKey("memories.id", ondelete="CASCADE"), nullable=False, index=True)
    entity_type = Column(String, nullable=False, index=True) # person, location, date, topic, emotion
    entity_value = Column(String, nullable=False, index=True)

    memory = relationship("Memory", back_populates="entities")

class MemoryEmbedding(Base):
    __tablename__ = "memory_embeddings"

    id = Column(String, primary_key=True, default=generate_uuid)
    memory_id = Column(String, ForeignKey("memories.id", ondelete="CASCADE"), nullable=False, index=True)
    chunk_index = Column(Integer, default=0)
    chunk_text = Column(Text, nullable=False)
    embedding_json = Column(JSON, nullable=False) # List of floats
    embedding_model = Column(String, nullable=False)

    memory = relationship("Memory", back_populates="embeddings")

class ProcessingLog(Base):
    __tablename__ = "processing_logs"

    id = Column(String, primary_key=True, default=generate_uuid)
    memory_id = Column(String, ForeignKey("memories.id", ondelete="CASCADE"), nullable=False, index=True)
    step_name = Column(String, nullable=False) # transcription, vision_analysis, entity_extraction, summarization, embedding
    status = Column(String, nullable=False) # started, completed, failed, skipped
    message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    memory = relationship("Memory", back_populates="logs")
