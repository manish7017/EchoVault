import os
import json
import logging
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from PIL import Image
import exifread
from pypdf import PdfReader
import mutagen

from sqlalchemy.orm import Session
from app.config import settings
from app.models.memory import Memory, MemoryEntity, ProcessingLog, Tag
from app.services.ai_adapter import llm_adapter, embedding_adapter, vision_adapter
from app.services.vector_store import vector_store
from app.services.audio_transcription import audio_transcription_service

logger = logging.getLogger(__name__)

class EchoEngine:
    """Core memory understanding and indexing engine."""

    def log_step(self, db: Session, memory_id: str, step_name: str, status: str, message: Optional[str] = None):
        log = ProcessingLog(
            memory_id=memory_id,
            step_name=step_name,
            status=status,
            message=message
        )
        db.add(log)
        db.commit()

    def extract_image_metadata(self, file_path: str) -> Dict[str, Any]:
        meta: Dict[str, Any] = {}
        try:
            with Image.open(file_path) as img:
                meta["dimensions"] = {"width": img.width, "height": img.height}
                meta["format"] = img.format
                meta["mode"] = img.mode

            with open(file_path, "rb") as f:
                tags = exifread.process_file(f, details=False)
                exif_data = {}
                for tag, value in tags.items():
                    if tag not in ("JPEGThumbnail", "TIFFThumbnail"):
                        exif_data[tag] = str(value)
                if exif_data:
                    meta["exif"] = exif_data
                    if "Image Model" in exif_data:
                        meta["camera"] = exif_data["Image Model"]
                    if "EXIF DateTimeOriginal" in exif_data:
                        meta["date_taken"] = exif_data["EXIF DateTimeOriginal"]
        except Exception as e:
            logger.warning(f"Error extracting image metadata: {e}")
        return meta

    def extract_audio_metadata(self, file_path: str) -> Dict[str, Any]:
        meta: Dict[str, Any] = {}
        try:
            audio = mutagen.File(file_path)
            if audio is not None and audio.info is not None:
                meta["length_seconds"] = round(audio.info.length, 2)
                if hasattr(audio.info, "bitrate"):
                    meta["bitrate_kbps"] = round(audio.info.bitrate / 1000, 1)
                if hasattr(audio.info, "sample_rate"):
                    meta["sample_rate_hz"] = audio.info.sample_rate
                if hasattr(audio.info, "channels"):
                    meta["channels"] = audio.info.channels
        except Exception as e:
            logger.warning(f"Error extracting audio metadata: {e}")
        return meta

    def extract_pdf_content(self, file_path: str) -> Dict[str, Any]:
        text_parts = []
        meta: Dict[str, Any] = {}
        try:
            reader = PdfReader(file_path)
            meta["page_count"] = len(reader.pages)
            if reader.metadata:
                meta["pdf_title"] = reader.metadata.get("/Title")
                meta["pdf_author"] = reader.metadata.get("/Author")

            for i, page in enumerate(reader.pages):
                page_text = page.extract_text()
                if page_text:
                    text_parts.append(page_text.strip())
        except Exception as e:
            logger.warning(f"Error extracting PDF content: {e}")
        return {
            "text": "\n\n".join(text_parts).strip(),
            "metadata": meta
        }

    async def extract_entities_and_topics(self, text: str) -> Dict[str, List[str]]:
        """Extracts people, locations, dates, themes, and emotional tone via local LLM."""
        if not text or len(text.strip()) < 10:
            return {"people": [], "locations": [], "dates": [], "topics": [], "tags": []}

        system_prompt = (
            "You are an archival analyst for EchoVault. Extract key archival entities and return ONLY a valid JSON object "
            "with these exact keys: people (list of names), locations (places mentioned), "
            "dates (years or timeframes mentioned), topics (3-5 subjects), tags (3-5 short keywords). "
            "Do NOT include explanation or markdown formatting."
        )
        prompt = f"Archival document text:\n\"\"\"\n{text[:2500]}\n\"\"\"\n\nExtract entities as JSON."

        try:
            response = await llm_adapter.generate(prompt=prompt, system=system_prompt, temperature=0.1)
            # Clean markdown code block if model wrapped it in ```json
            cleaned = response.strip()
            if cleaned.startswith("```"):
                cleaned = cleaned.split("\n", 1)[-1]
            if cleaned.endswith("```"):
                cleaned = cleaned.rsplit("```", 1)[0]
            cleaned = cleaned.strip()

            parsed = json.loads(cleaned)
            return {
                "people": parsed.get("people", []) if isinstance(parsed.get("people"), list) else [],
                "locations": parsed.get("locations", []) if isinstance(parsed.get("locations"), list) else [],
                "dates": parsed.get("dates", []) if isinstance(parsed.get("dates"), list) else [],
                "topics": parsed.get("topics", []) if isinstance(parsed.get("topics"), list) else [],
                "tags": parsed.get("tags", []) if isinstance(parsed.get("tags"), list) else []
            }
        except Exception as e:
            logger.warning(f"Failed to parse LLM entity extraction: {e}")
            return {"people": [], "locations": [], "dates": [], "topics": [], "tags": []}

    async def generate_summary(self, title: str, text: str, memory_type: str) -> str:
        """Generates a concise, atmospheric archival summary using the local LLM."""
        if not text or len(text.strip()) < 5:
            return f"Archived {memory_type} titled '{title}'."

        system_prompt = (
            "You are the archivist of EchoVault. Summarize this memory in 2 to 3 evocative, accurate sentences. "
            "Focus strictly on preserving what is documented without inventing false facts."
        )
        prompt = f"Title: {title}\nType: {memory_type}\nContent:\n{text[:3000]}\n\nSummary:"

        try:
            summary = await llm_adapter.generate(prompt=prompt, system=system_prompt, temperature=0.3)
            return summary.strip()
        except Exception as e:
            logger.warning(f"Summary generation error: {e}")
            return f"Archived {memory_type} titled '{title}'. {text[:150]}..."

    async def process_memory(self, db: Session, memory_id: str):
        """Asynchronous pipeline to understand, summarize, index and embed a memory."""
        memory = db.query(Memory).filter(Memory.id == memory_id).first()
        if not memory:
            logger.error(f"Memory {memory_id} not found for processing")
            return

        memory.processing_status = "processing"
        db.commit()

        try:
            extracted_text = memory.extracted_text or ""
            technical_meta = memory.technical_metadata or {}
            file_path = memory.file_path

            # Step 1: Content Extraction based on Type
            if memory.memory_type == "photo" and file_path and os.path.exists(file_path):
                self.log_step(db, memory_id, "metadata_extraction", "started", "Extracting EXIF metadata...")
                img_meta = self.extract_image_metadata(file_path)
                technical_meta.update(img_meta)
                self.log_step(db, memory_id, "metadata_extraction", "completed", f"Extracted dimensions: {img_meta.get('dimensions')}")

                self.log_step(db, memory_id, "vision_analysis", "started", "Analyzing image with local vision model...")
                try:
                    vision_desc = await vision_adapter.analyze_image(file_path)
                    extracted_text = (extracted_text + "\n\n" + vision_desc).strip()
                    self.log_step(db, memory_id, "vision_analysis", "completed", "Vision analysis completed.")
                except Exception as ve:
                    self.log_step(db, memory_id, "vision_analysis", "failed", f"Vision model unavailable: {ve}")

            elif memory.memory_type == "audio" and file_path and os.path.exists(file_path):
                self.log_step(db, memory_id, "metadata_extraction", "started", "Extracting audio metadata...")
                aud_meta = self.extract_audio_metadata(file_path)
                technical_meta.update(aud_meta)
                self.log_step(db, memory_id, "metadata_extraction", "completed", f"Length: {aud_meta.get('length_seconds')}s")

                self.log_step(db, memory_id, "audio_transcription", "started", "Transcribing speech using local faster-whisper...")
                try:
                    transcription = await audio_transcription_service.transcribe(file_path)
                    extracted_text = (extracted_text + "\n\n" + transcription.get("text", "")).strip()
                    technical_meta["transcription_info"] = {
                        "language": transcription.get("language"),
                        "duration": transcription.get("duration")
                    }
                    self.log_step(db, memory_id, "audio_transcription", "completed", f"Transcribed {len(transcription.get('text', ''))} characters.")
                except Exception as te:
                    self.log_step(db, memory_id, "audio_transcription", "failed", f"Audio transcription error: {te}")

            elif memory.memory_type == "document" and file_path and os.path.exists(file_path):
                self.log_step(db, memory_id, "document_extraction", "started", "Parsing document...")
                ext = file_path.lower().split(".")[-1]
                if ext == "pdf":
                    doc_res = self.extract_pdf_content(file_path)
                    extracted_text = (extracted_text + "\n\n" + doc_res.get("text", "")).strip()
                    technical_meta.update(doc_res.get("metadata", {}))
                else: # text, md, json
                    with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                        file_content = f.read()
                    extracted_text = (extracted_text + "\n\n" + file_content).strip()
                    technical_meta["word_count"] = len(file_content.split())
                self.log_step(db, memory_id, "document_extraction", "completed", f"Extracted {len(extracted_text)} characters.")

            elif memory.memory_type == "story":
                # Manual story
                extracted_text = (memory.description or "").strip()
                technical_meta["word_count"] = len(extracted_text.split())
                self.log_step(db, memory_id, "story_processing", "completed", "Manual story recorded.")

            # Append user description to full text for indexing
            full_context_text = f"Title: {memory.title}\n"
            if memory.recorded_date:
                full_context_text += f"Date: {memory.recorded_date}\n"
            if memory.location:
                full_context_text += f"Location: {memory.location}\n"
            if memory.description:
                full_context_text += f"User Notes: {memory.description}\n"
            if extracted_text:
                full_context_text += f"Extracted Content:\n{extracted_text}\n"

            memory.extracted_text = extracted_text.strip()
            memory.technical_metadata = technical_meta

            # Step 2: Summarization
            self.log_step(db, memory_id, "summarization", "started", "Generating concise archival summary...")
            summary = await self.generate_summary(memory.title, full_context_text, memory.memory_type)
            memory.ai_summary = summary
            self.log_step(db, memory_id, "summarization", "completed", "Summary generated.")

            # Step 3: Entity & Topic Extraction
            self.log_step(db, memory_id, "entity_extraction", "started", "Extracting people, locations, dates, and topics...")
            entities_dict = await self.extract_entities_and_topics(full_context_text)
            
            # Store entities
            for person in entities_dict.get("people", []):
                db.add(MemoryEntity(memory_id=memory_id, entity_type="person", entity_value=person))
            for loc in entities_dict.get("locations", []):
                db.add(MemoryEntity(memory_id=memory_id, entity_type="location", entity_value=loc))
            for dt in entities_dict.get("dates", []):
                db.add(MemoryEntity(memory_id=memory_id, entity_type="date", entity_value=dt))
            for top in entities_dict.get("topics", []):
                db.add(MemoryEntity(memory_id=memory_id, entity_type="topic", entity_value=top))

            # Store tags
            for tag_name in entities_dict.get("tags", []):
                tag_name_clean = tag_name.strip().lower()
                if tag_name_clean:
                    existing_tag = db.query(Tag).filter(Tag.name == tag_name_clean).first()
                    if not existing_tag:
                        existing_tag = Tag(name=tag_name_clean)
                        db.add(existing_tag)
                        db.flush()
                    if existing_tag not in memory.tags:
                        memory.tags.append(existing_tag)

            self.log_step(db, memory_id, "entity_extraction", "completed", f"Extracted {len(entities_dict.get('people', []))} people, {len(entities_dict.get('topics', []))} topics.")

            # Step 4: Embedding Generation & Vector Indexing
            self.log_step(db, memory_id, "embedding", "started", "Generating local vector embeddings...")
            
            # Delete existing embeddings for this memory if re-processing
            db.query(Memory).filter(Memory.id == memory_id).first().embeddings.clear()
            
            # Chunking strategy: chunk full text into ~500 token segments or paragraphs
            chunks = self._chunk_text(full_context_text, max_chunk_size=1000)
            for idx, chunk in enumerate(chunks):
                emb = await embedding_adapter.embed_text(chunk)
                vector_store.save_embedding(
                    db=db,
                    memory_id=memory_id,
                    chunk_index=idx,
                    chunk_text=chunk,
                    embedding=emb,
                    model_name=settings.OLLAMA_EMBED_MODEL
                )
            
            self.log_step(db, memory_id, "embedding", "completed", f"Generated {len(chunks)} vector embedding chunks.")

            memory.processing_status = "completed"
            memory.processing_error = None
            db.commit()
            logger.info(f"Memory {memory_id} processed successfully.")

        except Exception as e:
            logger.exception(f"EchoEngine failed for memory {memory_id}: {e}")
            memory.processing_status = "failed"
            memory.processing_error = str(e)
            self.log_step(db, memory_id, "pipeline_error", "failed", str(e))
            db.commit()

    def _chunk_text(self, text: str, max_chunk_size: int = 1000) -> List[str]:
        if not text:
            return ["Empty memory content"]
        
        paragraphs = text.split("\n\n")
        chunks = []
        current_chunk = ""

        for p in paragraphs:
            p = p.strip()
            if not p:
                continue
            if len(current_chunk) + len(p) < max_chunk_size:
                current_chunk += ("\n\n" + p if current_chunk else p)
            else:
                if current_chunk:
                    chunks.append(current_chunk)
                current_chunk = p

        if current_chunk:
            chunks.append(current_chunk)

        return chunks or [text[:max_chunk_size]]

echo_engine = EchoEngine()
