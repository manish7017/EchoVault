from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict

class SourceCitation(BaseModel):
    memory_id: str
    title: str
    memory_type: str
    recorded_date: Optional[str] = None
    similarity_score: float
    snippet: str

class ChatQueryRequest(BaseModel):
    message: str
    session_id: Optional[str] = None
    collection_id: Optional[str] = None # Optional filter to specific collection

class ChatMessageResponse(BaseModel):
    id: str
    role: str
    content: str
    sources: Optional[List[SourceCitation]] = []
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class ConversationSessionResponse(BaseModel):
    id: str
    title: str
    created_at: datetime
    updated_at: datetime
    messages: List[ChatMessageResponse] = []
    model_config = ConfigDict(from_attributes=True)
