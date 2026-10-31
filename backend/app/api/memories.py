import os
import shutil
import uuid
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, BackgroundTasks, Query
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc, asc

from app.config import settings
from app.database import get_db
from app.models.memory import Memory, Collection, Tag, MemoryEntity, ProcessingLog
from app.schemas.memory import (
    MemoryResponse, MemoryDetailResponse, MemoryCreateManual, MemoryUpdate, ProcessingLogResponse, MemoryEntityResponse
)
from app.services.echo_engine import echo_engine

router = APIRouter(prefix="/api/memories", tags=["memories"])

def format_memory_response(m: Memory) -> MemoryResponse:
    return MemoryResponse(
        id=m.id,
        title=m.title,
        description=m.description,
        memory_type=m.memory_type,
        original_filename=m.original_filename,
        file_path=f"/api/memories/{m.id}/file" if m.file_path else None,
        mime_type=m.mime_type,
        file_size=m.file_size,
        recorded_date=m.recorded_date,
        recorded_year=m.recorded_year,
        recorded_month=m.recorded_month,
        location=m.location,
        created_at=m.created_at,
        updated_at=m.updated_at,
        last_accessed_at=m.last_accessed_at,
        access_count=m.access_count,
        ai_summary=m.ai_summary,
        processing_status=m.processing_status,
        processing_error=m.processing_error,
        is_sample=m.is_sample,
        collection_id=m.collection_id,
        collection_name=m.collection.name if m.collection else None,
        tags=[t.name for t in m.tags],
        entities=[
            MemoryEntityResponse(id=e.id, entity_type=e.entity_type, entity_value=e.entity_value)
            for e in m.entities
        ]
    )

@router.post("/upload", response_model=MemoryResponse)
async def upload_memory(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    title: str = Form(...),
    description: Optional[str] = Form(None),
    recorded_date: Optional[str] = Form(None),
    location: Optional[str] = Form(None),
    collection_id: Optional[str] = Form(None),
    tags: Optional[str] = Form(None), # comma-separated
    db: Session = Depends(get_db)
):
    # Validate extension
    filename = file.filename or "unknown"
    ext = filename.split(".")[-1].lower() if "." in filename else ""
    if ext not in settings.ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"File extension '.{ext}' is not supported. Allowed: {', '.join(sorted(settings.ALLOWED_EXTENSIONS))}"
        )

    # Determine memory type
    if ext in ["jpg", "jpeg", "png", "webp", "gif", "bmp", "tiff"]:
        memory_type = "photo"
    elif ext in ["mp3", "wav", "m4a", "ogg", "flac", "aac"]:
        memory_type = "audio"
    elif ext in ["pdf", "txt", "md", "json"]:
        memory_type = "document"
    else:
        memory_type = "document"

    # Save file safely
    file_id = f"{uuid.uuid4().hex}_{filename}"
    dest_path = settings.UPLOADS_DIR / file_id

    # Read and enforce file size limit
    file_size = 0
    with open(dest_path, "wb") as buffer:
        while chunk := await file.read(1024 * 1024): # 1MB chunks
            file_size += len(chunk)
            if file_size > settings.MAX_FILE_SIZE_MB * 1024 * 1024:
                dest_path.unlink(missing_ok=True)
                raise HTTPException(status_code=413, detail=f"File exceeds maximum allowed size ({settings.MAX_FILE_SIZE_MB}MB)")
            buffer.write(chunk)

    # Parse recorded date for year/month indexing
    rec_year, rec_month = None, None
    if recorded_date:
        parts = recorded_date.split("-")
        if len(parts) >= 1 and parts[0].isdigit():
            rec_year = int(parts[0])
        if len(parts) >= 2 and parts[1].isdigit():
            rec_month = int(parts[1])

    memory = Memory(
        title=title,
        description=description,
        memory_type=memory_type,
        original_filename=filename,
        file_path=str(dest_path),
        mime_type=file.content_type,
        file_size=file_size,
        recorded_date=recorded_date,
        recorded_year=rec_year,
        recorded_month=rec_month,
        location=location,
        collection_id=collection_id if collection_id else None,
        processing_status="pending",
        is_sample=False
    )
    db.add(memory)
    db.flush()

    # Process tags
    if tags:
        tag_list = [t.strip().lower() for t in tags.split(",") if t.strip()]
        for tname in tag_list:
            tag = db.query(Tag).filter(Tag.name == tname).first()
            if not tag:
                tag = Tag(name=tname)
                db.add(tag)
                db.flush()
            memory.tags.append(tag)

    db.commit()
    db.refresh(memory)

    # Enqueue background processing with EchoEngine
    background_tasks.add_task(echo_engine.process_memory, db, memory.id)

    return format_memory_response(memory)

@router.post("/manual", response_model=MemoryResponse)
async def create_manual_story(
    payload: MemoryCreateManual,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    rec_year, rec_month = None, None
    if payload.recorded_date:
        parts = payload.recorded_date.split("-")
        if len(parts) >= 1 and parts[0].isdigit():
            rec_year = int(parts[0])
        if len(parts) >= 2 and parts[1].isdigit():
            rec_month = int(parts[1])

    memory = Memory(
        title=payload.title,
        description=payload.description,
        memory_type="story",
        recorded_date=payload.recorded_date,
        recorded_year=rec_year,
        recorded_month=rec_month,
        location=payload.location,
        collection_id=payload.collection_id,
        processing_status="pending",
        is_sample=False
    )
    db.add(memory)
    db.flush()

    if payload.tags:
        for tname in payload.tags:
            clean_name = tname.strip().lower()
            if clean_name:
                tag = db.query(Tag).filter(Tag.name == clean_name).first()
                if not tag:
                    tag = Tag(name=clean_name)
                    db.add(tag)
                    db.flush()
                memory.tags.append(tag)

    db.commit()
    db.refresh(memory)

    # Enqueue background processing
    background_tasks.add_task(echo_engine.process_memory, db, memory.id)

    return format_memory_response(memory)

@router.get("", response_model=List[MemoryResponse])
def list_memories(
    query: Optional[str] = Query(None),
    memory_type: Optional[str] = Query(None),
    collection_id: Optional[str] = Query(None),
    tag: Optional[str] = Query(None),
    person: Optional[str] = Query(None),
    year: Optional[int] = Query(None),
    limit: int = Query(50, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    q = db.query(Memory)

    if query:
        search_term = f"%{query}%"
        q = q.filter(
            or_(
                Memory.title.ilike(search_term),
                Memory.description.ilike(search_term),
                Memory.extracted_text.ilike(search_term),
                Memory.location.ilike(search_term)
            )
        )

    if memory_type:
        q = q.filter(Memory.memory_type == memory_type)

    if collection_id:
        q = q.filter(Memory.collection_id == collection_id)

    if tag:
        q = q.join(Memory.tags).filter(Tag.name == tag.lower())

    if person:
        q = q.join(Memory.entities).filter(
            MemoryEntity.entity_type == "person",
            MemoryEntity.entity_value.ilike(f"%{person}%")
        )

    if year:
        q = q.filter(Memory.recorded_year == year)

    # Order newest or most recently updated first
    memories = q.order_by(desc(Memory.created_at)).offset(offset).limit(limit).all()
    return [format_memory_response(m) for m in memories]

@router.get("/forgotten", response_model=List[MemoryResponse])
def get_forgotten_memories(
    limit: int = Query(6, le=20),
    db: Session = Depends(get_db)
):
    """
    Surfaces memories from 'The Forgotten Drawer':
    - Memories not opened for a long time (lowest access_count or oldest last_accessed_at)
    - Photos without descriptions
    - Audio recordings without transcripts or unfinished entries
    """
    memories = (
        db.query(Memory)
        .order_by(
            asc(Memory.access_count),
            asc(Memory.last_accessed_at)
        )
        .limit(limit)
        .all()
    )
    return [format_memory_response(m) for m in memories]

@router.get("/{id}", response_model=MemoryDetailResponse)
def get_memory_detail(id: str, db: Session = Depends(get_db)):
    memory = db.query(Memory).filter(Memory.id == id).first()
    if not memory:
        raise HTTPException(status_code=404, detail="Memory not found")

    # Update access tracking
    memory.access_count += 1
    memory.last_accessed_at = datetime.now(timezone.utc)
    db.commit()

    # Find related memories (sharing same collection or tags)
    tag_ids = [t.id for t in memory.tags]
    related = []
    if tag_ids or memory.collection_id:
        related_query = db.query(Memory).filter(Memory.id != memory.id)
        conditions = []
        if memory.collection_id:
            conditions.append(Memory.collection_id == memory.collection_id)
        if tag_ids:
            conditions.append(Memory.tags.any(Tag.id.in_(tag_ids)))
        related = related_query.filter(or_(*conditions)).limit(4).all()

    base_resp = format_memory_response(memory)
    return MemoryDetailResponse(
        **base_resp.model_dump(),
        extracted_text=memory.extracted_text,
        technical_metadata=memory.technical_metadata,
        logs=[
            ProcessingLogResponse(
                id=l.id,
                step_name=l.step_name,
                status=l.status,
                message=l.message,
                created_at=l.created_at
            ) for l in memory.logs
        ],
        related_memories=[format_memory_response(r) for r in related]
    )

@router.put("/{id}", response_model=MemoryResponse)
def update_memory(
    id: str,
    payload: MemoryUpdate,
    db: Session = Depends(get_db)
):
    memory = db.query(Memory).filter(Memory.id == id).first()
    if not memory:
        raise HTTPException(status_code=404, detail="Memory not found")

    if payload.title is not None:
        memory.title = payload.title
    if payload.description is not None:
        memory.description = payload.description
    if payload.recorded_date is not None:
        memory.recorded_date = payload.recorded_date
        parts = payload.recorded_date.split("-")
        if len(parts) >= 1 and parts[0].isdigit():
            memory.recorded_year = int(parts[0])
        if len(parts) >= 2 and parts[1].isdigit():
            memory.recorded_month = int(parts[1])
    if payload.location is not None:
        memory.location = payload.location
    if payload.collection_id is not None:
        memory.collection_id = payload.collection_id

    if payload.tags is not None:
        memory.tags.clear()
        for tname in payload.tags:
            clean_name = tname.strip().lower()
            if clean_name:
                tag = db.query(Tag).filter(Tag.name == clean_name).first()
                if not tag:
                    tag = Tag(name=clean_name)
                    db.add(tag)
                    db.flush()
                memory.tags.append(tag)

    memory.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(memory)
    return format_memory_response(memory)

@router.delete("/{id}")
def delete_memory(id: str, db: Session = Depends(get_db)):
    memory = db.query(Memory).filter(Memory.id == id).first()
    if not memory:
        raise HTTPException(status_code=404, detail="Memory not found")

    # Delete physical file if exists
    if memory.file_path and os.path.exists(memory.file_path):
        try:
            os.remove(memory.file_path)
        except Exception as e:
            pass

    db.delete(memory)
    db.commit()
    return {"message": "Memory deleted successfully", "id": id}

@router.post("/{id}/reprocess", response_model=MemoryResponse)
async def reprocess_memory(
    id: str,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    memory = db.query(Memory).filter(Memory.id == id).first()
    if not memory:
        raise HTTPException(status_code=404, detail="Memory not found")

    memory.processing_status = "pending"
    db.commit()

    background_tasks.add_task(echo_engine.process_memory, db, memory.id)
    return format_memory_response(memory)

@router.get("/{id}/file")
def get_memory_file(id: str, db: Session = Depends(get_db)):
    memory = db.query(Memory).filter(Memory.id == id).first()
    if not memory or not memory.file_path or not os.path.exists(memory.file_path):
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(
        path=memory.file_path,
        media_type=memory.mime_type or "application/octet-stream",
        filename=memory.original_filename or os.path.basename(memory.file_path)
    )
