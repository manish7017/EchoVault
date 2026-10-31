import logging
import os
from typing import Dict, Any, Optional
from app.config import settings

logger = logging.getLogger(__name__)

class AudioTranscriptionService:
    """Offline audio transcription powered by faster-whisper."""

    def __init__(self, model_size: Optional[str] = None):
        self.model_size = model_size or settings.WHISPER_MODEL_SIZE
        self._model = None

    def _get_model(self):
        if self._model is None:
            from faster_whisper import WhisperModel
            logger.info(f"Loading faster-whisper model '{self.model_size}' on CPU (int8)...")
            self._model = WhisperModel(self.model_size, device="cpu", compute_type="int8")
        return self._model

    def check_availability(self) -> Dict[str, Any]:
        try:
            import faster_whisper
            return {
                "available": True,
                "model": self.model_size,
                "provider": "faster-whisper",
                "message": f"faster-whisper ready (model: {self.model_size})"
            }
        except ImportError as e:
            return {
                "available": False,
                "model": self.model_size,
                "provider": "faster-whisper",
                "message": f"faster-whisper not installed: {str(e)}"
            }

    async def transcribe(self, audio_path: str) -> Dict[str, Any]:
        if not os.path.exists(audio_path):
            raise FileNotFoundError(f"Audio file not found at: {audio_path}")

        try:
            model = self._get_model()
            # Transcribe audio file
            segments, info = model.transcribe(audio_path, beam_size=2)
            
            transcription_parts = []
            segment_list = []
            for segment in segments:
                text = segment.text.strip()
                if text:
                    transcription_parts.append(text)
                    segment_list.append({
                        "start": round(segment.start, 2),
                        "end": round(segment.end, 2),
                        "text": text
                    })

            full_text = " ".join(transcription_parts).strip()
            return {
                "text": full_text,
                "language": info.language,
                "language_probability": round(info.language_probability, 3),
                "duration": round(info.duration, 2),
                "segments": segment_list
            }
        except Exception as e:
            logger.error(f"Error during audio transcription: {e}")
            raise RuntimeError(f"Audio transcription failed: {str(e)}")

audio_transcription_service = AudioTranscriptionService()
