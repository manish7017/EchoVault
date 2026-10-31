import os
import shutil
import zipfile
import json
import logging
from datetime import datetime, timezone
from pathlib import Path
from sqlalchemy.orm import Session
from app.config import settings
from app.models.memory import Memory, Collection, Tag, MemoryEntity
from app.models.ghost_story import GhostStory

logger = logging.getLogger(__name__)

class ExportService:
    """Service for exporting and wiping user memory archives."""

    def export_archive(self, db: Session) -> str:
        timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
        export_filename = f"echovault_export_{timestamp}.zip"
        zip_path = settings.EXPORTS_DIR / export_filename

        memories = db.query(Memory).all()
        collections = db.query(Collection).all()
        stories = db.query(GhostStory).all()

        archive_data = {
            "app": settings.APP_NAME,
            "version": settings.VERSION,
            "exported_at": datetime.now(timezone.utc).isoformat(),
            "tagline": settings.TAGLINE,
            "collections": [
                {
                    "id": c.id,
                    "name": c.name,
                    "description": c.description,
                    "icon": c.icon,
                    "color": c.color
                } for c in collections
            ],
            "memories": [
                {
                    "id": m.id,
                    "title": m.title,
                    "description": m.description,
                    "memory_type": m.memory_type,
                    "recorded_date": m.recorded_date,
                    "location": m.location,
                    "original_filename": m.original_filename,
                    "mime_type": m.mime_type,
                    "file_size": m.file_size,
                    "ai_summary": m.ai_summary,
                    "extracted_text": m.extracted_text,
                    "is_sample": m.is_sample,
                    "collection_id": m.collection_id,
                    "tags": [t.name for t in m.tags],
                    "entities": [{"type": e.entity_type, "value": e.entity_value} for e in m.entities]
                } for m in memories
            ],
            "ghost_stories": [
                {
                    "id": s.id,
                    "title": s.title,
                    "narrative_style": s.narrative_style,
                    "story_text": s.story_text,
                    "created_at": s.created_at.isoformat() if s.created_at else None
                } for s in stories
            ]
        }

        # Generate Human-Readable Markdown Catalog
        md_lines = [
            f"# EchoVault Memory Archive Catalog",
            f"*Exported on {datetime.now(timezone.utc).strftime('%B %d, %Y at %H:%M UTC')}*",
            f"*{settings.TAGLINE}*\n",
            "## Summary",
            f"- **Total Memories Archived:** {len(memories)}",
            f"- **Collections:** {len(collections)}",
            f"- **Ghost Stories Generated:** {len(stories)}\n",
            "## Archived Memories\n"
        ]

        for m in memories:
            md_lines.append(f"### {m.title}")
            md_lines.append(f"- **Type:** {m.memory_type.capitalize()}")
            md_lines.append(f"- **Date:** {m.recorded_date or 'Undated'}")
            md_lines.append(f"- **Location:** {m.location or 'Unspecified'}")
            if m.tags:
                md_lines.append(f"- **Tags:** {', '.join([t.name for t in m.tags])}")
            if m.ai_summary:
                md_lines.append(f"\n> **Archival Summary:** {m.ai_summary}\n")
            if m.description:
                md_lines.append(f"**Personal Notes:**\n{m.description}\n")
            if m.extracted_text and len(m.extracted_text) < 1500:
                md_lines.append(f"**Extracted Content / Transcript:**\n```\n{m.extracted_text}\n```\n")
            md_lines.append("---\n")

        markdown_content = "\n".join(md_lines)

        # Write to zip
        with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
            zf.writestr("archive_metadata.json", json.dumps(archive_data, indent=2))
            zf.writestr("ARCHIVE_CATALOG.md", markdown_content)

            # Copy stored files
            for m in memories:
                if m.file_path and os.path.exists(m.file_path):
                    rel_name = os.path.basename(m.file_path)
                    zf.write(m.file_path, arcname=f"files/{rel_name}")

        return str(zip_path)

    def wipe_entire_archive(self, db: Session):
        """Permanently deletes all memories, collections, stories, and uploads."""
        logger.warning("Permanently wiping EchoVault archive as requested by user.")
        
        # 1. Clear tables
        db.query(Memory).delete()
        db.query(Collection).delete()
        db.query(Tag).delete()
        db.query(GhostStory).delete()
        db.commit()

        # 2. Clear upload and audio files
        for folder in [settings.UPLOADS_DIR, settings.AUDIO_DIR, settings.PROCESSED_DIR]:
            for item in folder.iterdir():
                try:
                    if item.is_file():
                        item.unlink()
                    elif item.is_dir():
                        shutil.rmtree(item)
                except Exception as e:
                    logger.error(f"Error removing {item}: {e}")

export_service = ExportService()
