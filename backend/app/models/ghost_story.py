import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, Boolean, DateTime, JSON
from app.database import Base

def generate_uuid() -> str:
    return str(uuid.uuid4())

class GhostStory(Base):
    __tablename__ = "ghost_stories"

    id = Column(String, primary_key=True, default=generate_uuid)
    title = Column(String, nullable=False)
    narrative_style = Column(String, nullable=False, default="haunted_gothic")
    # Styles: haunted_gothic, mysterious_noir, first_person_echo, chronological_reconstruction
    
    prompt = Column(Text, nullable=True)
    story_text = Column(Text, nullable=False)
    audio_path = Column(String, nullable=True) # Generated narration audio file
    source_memory_ids = Column(JSON, nullable=False) # List of UUIDs of memories used
    
    disclaimer = Column(
        String, 
        default="Fictional interpretation: EchoVault generated this story as a fictional narrative inspired by archive artifacts, not an actual communication from deceased persons."
    )
    
    is_sample = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
