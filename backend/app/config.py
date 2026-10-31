import os
from pathlib import Path
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    APP_NAME: str = "EchoVault"
    VERSION: str = "1.0.0"
    TAGLINE: str = "Some memories never leave. They just wait to be remembered."
    
    BASE_DIR: Path = Path(__file__).resolve().parent.parent
    STORAGE_DIR: Path = BASE_DIR / "storage"
    UPLOADS_DIR: Path = STORAGE_DIR / "uploads"
    PROCESSED_DIR: Path = STORAGE_DIR / "processed"
    AUDIO_DIR: Path = STORAGE_DIR / "audio"
    EXPORTS_DIR: Path = STORAGE_DIR / "exports"
    
    DATABASE_URL: str = f"sqlite:///{BASE_DIR}/echovault.db"
    
    # AI Configuration
    OLLAMA_BASE_URL: str = os.getenv("OLLAMA_BASE_URL", "http://127.0.0.1:11434")
    OLLAMA_LLM_MODEL: str = os.getenv("OLLAMA_LLM_MODEL", "ornith:9b")
    OLLAMA_EMBED_MODEL: str = os.getenv("OLLAMA_EMBED_MODEL", "nomic-embed-text")
    OLLAMA_VISION_MODEL: str = os.getenv("OLLAMA_VISION_MODEL", "moondream")
    
    WHISPER_MODEL_SIZE: str = os.getenv("WHISPER_MODEL_SIZE", "tiny") # tiny/base for speed on CPU
    TTS_VOICE: str = os.getenv("TTS_VOICE", "en-US-GuyNeural") # Atmospheric deep storyteller voice
    
    # Ingestion & Limits
    MAX_FILE_SIZE_MB: int = 100
    ALLOWED_EXTENSIONS: set = {
        # Images
        "jpg", "jpeg", "png", "webp", "gif", "bmp", "tiff",
        # Audio
        "mp3", "wav", "m4a", "ogg", "flac", "aac",
        # Documents
        "pdf", "txt", "md", "json"
    }

    model_config = {"env_file": ".env", "extra": "ignore"}

settings = Settings()

# Ensure directories exist
settings.STORAGE_DIR.mkdir(parents=True, exist_ok=True)
settings.UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
settings.PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
settings.AUDIO_DIR.mkdir(parents=True, exist_ok=True)
settings.EXPORTS_DIR.mkdir(parents=True, exist_ok=True)
