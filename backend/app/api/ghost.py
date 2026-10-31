import os
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.config import settings
from app.database import get_db
from app.models.ghost_story import GhostStory
from app.schemas.ghost import GhostStoryCreateRequest, GhostStoryResponse
from app.services.ghost_chamber import ghost_chamber_service

router = APIRouter(prefix="/api/ghost", tags=["ghost"])

@router.post("/generate", response_model=GhostStoryResponse)
async def generate_ghost_story(
    payload: GhostStoryCreateRequest,
    db: Session = Depends(get_db)
):
    """Generate an eerie narrative or recollection from selected archived memories."""
    if not payload.memory_ids:
        raise HTTPException(status_code=400, detail="Please select at least one memory to inspire the narrative")

    try:
        story = await ghost_chamber_service.generate_story(db, payload)
        return story
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Story generation failed: {str(e)}")

@router.get("/stories", response_model=List[GhostStoryResponse])
def list_ghost_stories(db: Session = Depends(get_db)):
    stories = db.query(GhostStory).order_by(desc(GhostStory.created_at)).all()
    return [
        GhostStoryResponse(
            id=s.id,
            title=s.title,
            narrative_style=s.narrative_style,
            prompt=s.prompt,
            story_text=s.story_text,
            audio_path=s.audio_path,
            source_memory_ids=s.source_memory_ids,
            disclaimer=s.disclaimer,
            is_sample=s.is_sample,
            created_at=s.created_at
        ) for s in stories
    ]

@router.get("/stories/{id}", response_model=GhostStoryResponse)
def get_ghost_story(id: str, db: Session = Depends(get_db)):
    s = db.query(GhostStory).filter(GhostStory.id == id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Story not found")
    return GhostStoryResponse(
        id=s.id,
        title=s.title,
        narrative_style=s.narrative_style,
        prompt=s.prompt,
        story_text=s.story_text,
        audio_path=s.audio_path,
        source_memory_ids=s.source_memory_ids,
        disclaimer=s.disclaimer,
        is_sample=s.is_sample,
        created_at=s.created_at
    )

@router.delete("/stories/{id}")
def delete_ghost_story(id: str, db: Session = Depends(get_db)):
    s = db.query(GhostStory).filter(GhostStory.id == id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Story not found")
    db.delete(s)
    db.commit()
    return {"message": "Story deleted", "id": id}

@router.get("/narration/{filename}")
def stream_narration(filename: str):
    file_path = settings.AUDIO_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Narration audio not found")
    return FileResponse(path=str(file_path), media_type="audio/mpeg", filename=filename)
