import os
import psutil
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.config import settings
from app.database import get_db
from app.models.memory import Memory, Collection
from app.schemas.settings import SystemStatusResponse, ModelStatus, StorageStatsResponse
from app.services.ai_adapter import llm_adapter, embedding_adapter, vision_adapter
from app.services.audio_transcription import audio_transcription_service
from app.services.export_service import export_service

router = APIRouter(prefix="/api/settings", tags=["settings"])

@router.get("/status", response_model=SystemStatusResponse)
async def get_system_status():
    """Checks the status of all local open-source AI models and hardware."""
    llm_stat = await llm_adapter.check_availability()
    embed_stat = await embedding_adapter.check_availability()
    vision_stat = await vision_adapter.check_availability()
    whisper_stat = audio_transcription_service.check_availability()

    models = [
        ModelStatus(
            name=settings.OLLAMA_LLM_MODEL,
            category="llm",
            provider="ollama",
            is_available=llm_stat.get("available", False),
            details=llm_stat.get("message")
        ),
        ModelStatus(
            name=settings.OLLAMA_EMBED_MODEL,
            category="embedding",
            provider="ollama",
            is_available=embed_stat.get("available", False),
            details=embed_stat.get("message")
        ),
        ModelStatus(
            name=settings.OLLAMA_VISION_MODEL,
            category="vision",
            provider="ollama",
            is_available=vision_stat.get("available", False),
            details=vision_stat.get("message")
        ),
        ModelStatus(
            name=settings.WHISPER_MODEL_SIZE,
            category="transcription",
            provider="faster-whisper",
            is_available=whisper_stat.get("available", False),
            details=whisper_stat.get("message")
        ),
        ModelStatus(
            name=settings.TTS_VOICE,
            category="tts",
            provider="edge-tts",
            is_available=True,
            details="Atmospheric narrator ready"
        )
    ]

    # Hardware specs
    mem = psutil.virtual_memory()
    cpu_count = psutil.cpu_count(logical=True)
    cpu_percent = psutil.cpu_percent(interval=None)

    hardware_info = {
        "cpu_cores": cpu_count,
        "cpu_usage_percent": cpu_percent,
        "ram_total_gb": round(mem.total / (1024 ** 3), 1),
        "ram_available_gb": round(mem.available / (1024 ** 3), 1),
        "ram_used_percent": mem.percent
    }

    all_offline_ready = all(m.is_available for m in models[:4])

    return SystemStatusResponse(
        app_name=settings.APP_NAME,
        version=settings.VERSION,
        tagline=settings.TAGLINE,
        is_fully_offline=all_offline_ready,
        models=models,
        hardware_summary=hardware_info
    )

@router.get("/storage", response_model=StorageStatsResponse)
def get_storage_stats(db: Session = Depends(get_db)):
    total = db.query(func.count(Memory.id)).scalar() or 0
    photos = db.query(func.count(Memory.id)).filter(Memory.memory_type == "photo").scalar() or 0
    audio = db.query(func.count(Memory.id)).filter(Memory.memory_type == "audio").scalar() or 0
    docs = db.query(func.count(Memory.id)).filter(Memory.memory_type == "document").scalar() or 0
    stories = db.query(func.count(Memory.id)).filter(Memory.memory_type == "story").scalar() or 0

    total_files_size = sum(
        f.stat().st_size for f in settings.UPLOADS_DIR.glob("**/*") if f.is_file()
    )
    db_file = settings.BASE_DIR / "echovault.db"
    db_size = db_file.stat().st_size if db_file.exists() else 0

    return StorageStatsResponse(
        total_memories=total,
        photos_count=photos,
        audio_count=audio,
        documents_count=docs,
        stories_count=stories,
        total_file_size_bytes=total_files_size,
        database_size_bytes=db_size,
        storage_path=str(settings.STORAGE_DIR)
    )

@router.post("/export")
def export_archive_zip(db: Session = Depends(get_db)):
    zip_path = export_service.export_archive(db)
    filename = os.path.basename(zip_path)
    return FileResponse(
        path=zip_path,
        media_type="application/zip",
        filename=filename
    )

@router.delete("/wipe")
def wipe_archive(db: Session = Depends(get_db)):
    export_service.wipe_entire_archive(db)
    return {"message": "Entire memory archive permanently wiped."}
