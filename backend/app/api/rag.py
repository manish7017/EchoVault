from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.conversation import ConversationSession, ConversationMessage
from app.schemas.rag import (
    ChatQueryRequest, ChatMessageResponse, ConversationSessionResponse, SourceCitation
)
from app.services.rag_service import rag_service

router = APIRouter(prefix="/api/rag", tags=["rag"])

@router.post("/query")
async def ask_archive(payload: ChatQueryRequest, db: Session = Depends(get_db)):
    """Conversational RAG query answering based strictly on local memory embeddings."""
    if not payload.message or not payload.message.strip():
        raise HTTPException(status_code=400, detail="Query message cannot be empty")

    result = await rag_service.answer_query(
        db=db,
        message=payload.message.strip(),
        session_id=payload.session_id,
        collection_id=payload.collection_id
    )
    return result

@router.get("/sessions", response_model=List[ConversationSessionResponse])
def list_sessions(db: Session = Depends(get_db)):
    sessions = db.query(ConversationSession).order_by(ConversationSession.updated_at.desc()).all()
    res = []
    for s in sessions:
        res.append(ConversationSessionResponse(
            id=s.id,
            title=s.title,
            created_at=s.created_at,
            updated_at=s.updated_at,
            messages=[
                ChatMessageResponse(
                    id=m.id,
                    role=m.role,
                    content=m.content,
                    sources=[SourceCitation(**src) for src in (m.sources or [])],
                    created_at=m.created_at
                ) for m in s.messages
            ]
        ))
    return res

@router.get("/sessions/{id}", response_model=ConversationSessionResponse)
def get_session(id: str, db: Session = Depends(get_db)):
    s = db.query(ConversationSession).filter(ConversationSession.id == id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Conversation session not found")
    return ConversationSessionResponse(
        id=s.id,
        title=s.title,
        created_at=s.created_at,
        updated_at=s.updated_at,
        messages=[
            ChatMessageResponse(
                id=m.id,
                role=m.role,
                content=m.content,
                sources=[SourceCitation(**src) for src in (m.sources or [])],
                created_at=m.created_at
            ) for m in s.messages
        ]
    )

@router.delete("/sessions/{id}")
def delete_session(id: str, db: Session = Depends(get_db)):
    s = db.query(ConversationSession).filter(ConversationSession.id == id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Session not found")
    db.delete(s)
    db.commit()
    return {"message": "Session deleted", "id": id}
