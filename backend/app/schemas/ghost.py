from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict

class GhostStoryCreateRequest(BaseModel):
    title: Optional[str] = None
    memory_ids: List[str]
    narrative_style: str = "haunted_gothic"
    custom_prompt: Optional[str] = None
    generate_narration: bool = False

class GhostStoryResponse(BaseModel):
    id: str
    title: str
    narrative_style: str
    prompt: Optional[str] = None
    story_text: str
    audio_path: Optional[str] = None
    source_memory_ids: List[str] = []
    disclaimer: str
    is_sample: bool
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)
