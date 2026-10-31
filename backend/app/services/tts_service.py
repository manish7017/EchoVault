import os
import uuid
import logging
from typing import Optional
from app.config import settings

logger = logging.getLogger(__name__)

class TTSService:
    """Atmospheric audio narration generator using edge-tts or local fallback."""

    async def generate_narration(self, text: str, output_filename: Optional[str] = None) -> Optional[str]:
        if not text or not text.strip():
            return None

        clean_text = text.replace("#", "").replace("*", "").strip()
        # Truncate to reasonable length for storytelling narration
        clean_text = clean_text[:2500]

        file_id = output_filename or f"ghost_narration_{uuid.uuid4().hex[:8]}.mp3"
        dest_path = str(settings.AUDIO_DIR / file_id)

        try:
            import edge_tts
            # Atmospheric deep voice
            voice = settings.TTS_VOICE or "en-US-GuyNeural"
            communicate = edge_tts.Communicate(clean_text, voice, rate="-10%", pitch="-5Hz")
            await communicate.save(dest_path)
            logger.info(f"Narration audio generated at {dest_path}")
            return f"/api/ghost/narration/{file_id}"
        except Exception as e:
            logger.warning(f"Failed to generate TTS audio with edge-tts: {e}")
            return None

tts_service = TTSService()
