import base64
import logging
from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
import httpx
from app.config import settings

logger = logging.getLogger(__name__)

class AIAdapterException(Exception):
    """Exception raised when an AI model fails or is unavailable."""
    pass

class BaseLLMAdapter(ABC):
    @abstractmethod
    async def generate(self, prompt: str, system: Optional[str] = None, temperature: float = 0.7) -> str:
        pass

    @abstractmethod
    async def chat(self, messages: List[Dict[str, str]], temperature: float = 0.7) -> str:
        pass

    @abstractmethod
    async def check_availability(self) -> Dict[str, Any]:
        pass

class BaseEmbeddingAdapter(ABC):
    @abstractmethod
    async def embed_text(self, text: str) -> List[float]:
        pass

    @abstractmethod
    async def embed_batch(self, texts: List[str]) -> List[List[float]]:
        pass

    @abstractmethod
    async def check_availability(self) -> Dict[str, Any]:
        pass

class BaseVisionAdapter(ABC):
    @abstractmethod
    async def analyze_image(self, image_path: str, prompt: Optional[str] = None) -> str:
        pass

    @abstractmethod
    async def check_availability(self) -> Dict[str, Any]:
        pass


class OllamaLLMAdapter(BaseLLMAdapter):
    """Local LLM inference adapter via Ollama."""

    def __init__(self, base_url: Optional[str] = None, model: Optional[str] = None):
        self.base_url = (base_url or settings.OLLAMA_BASE_URL).rstrip("/")
        self.model = model or settings.OLLAMA_LLM_MODEL
        self._effective_model: Optional[str] = None

    async def get_active_model(self) -> str:
        if self._effective_model:
            return self._effective_model
        try:
            async with httpx.AsyncClient(timeout=4.0) as client:
                res = await client.get(f"{self.base_url}/api/tags")
                if res.status_code == 200:
                    models = [m["name"] for m in res.json().get("models", [])]
                    # If qwen2.5:1.5b is available, prefer it for fast local CPU inference
                    for candidate in ["qwen2.5:1.5b", "qwen2.5:latest", "ornith:9b", "gemma:2b"]:
                        if any(candidate in m for m in models):
                            self._effective_model = candidate
                            return candidate
        except Exception:
            pass
        return self.model

    async def check_availability(self) -> Dict[str, Any]:
        try:
            active = await self.get_active_model()
            async with httpx.AsyncClient(timeout=4.0) as client:
                res = await client.get(f"{self.base_url}/api/tags")
                if res.status_code == 200:
                    models = [m["name"] for m in res.json().get("models", [])]
                    has_model = any(active in m or m.startswith(active.split(":")[0]) for m in models)
                    return {
                        "available": has_model,
                        "model": active,
                        "installed_models": models,
                        "message": f"Model '{active}' ready for inference" if has_model else f"Model '{active}' not pulled yet."
                    }
                return {"available": False, "model": active, "message": f"Ollama HTTP {res.status_code}"}
        except Exception as e:
            return {"available": False, "model": self.model, "message": f"Cannot reach Ollama at {self.base_url}: {str(e)}"}

    async def generate(self, prompt: str, system: Optional[str] = None, temperature: float = 0.7, max_tokens: int = 512) -> str:
        active = await self.get_active_model()
        payload = {
            "model": active,
            "prompt": prompt,
            "stream": False,
            "options": {"temperature": temperature, "num_predict": max_tokens}
        }
        if system:
            payload["system"] = system

        try:
            async with httpx.AsyncClient(timeout=240.0) as client:
                res = await client.post(f"{self.base_url}/api/generate", json=payload)
                if res.status_code != 200:
                    raise AIAdapterException(f"Ollama generation failed ({res.status_code}): {res.text}")
                data = res.json()
                return data.get("response", "").strip()
        except httpx.ConnectError:
            raise AIAdapterException(f"Ollama is unreachable at {self.base_url}. Ensure 'ollama serve' is active.")
        except Exception as e:
            if isinstance(e, AIAdapterException):
                raise
            raise AIAdapterException(f"Error during LLM generation: {repr(e)}")

    async def chat(self, messages: List[Dict[str, str]], temperature: float = 0.7, max_tokens: int = 512) -> str:
        active = await self.get_active_model()
        payload = {
            "model": active,
            "messages": messages,
            "stream": False,
            "options": {"temperature": temperature, "num_predict": max_tokens}
        }
        try:
            async with httpx.AsyncClient(timeout=240.0) as client:
                res = await client.post(f"{self.base_url}/api/chat", json=payload)
                if res.status_code != 200:
                    raise AIAdapterException(f"Ollama chat failed ({res.status_code}): {res.text}")
                data = res.json()
                msg = data.get("message", {})
                return msg.get("content", "").strip()
        except httpx.ConnectError:
            raise AIAdapterException(f"Ollama is unreachable at {self.base_url}. Ensure 'ollama serve' is active.")
        except Exception as e:
            if isinstance(e, AIAdapterException):
                raise
            raise AIAdapterException(f"Error during LLM chat: {repr(e)}")


class OllamaEmbeddingAdapter(BaseEmbeddingAdapter):
    """Local embedding inference adapter via Ollama."""

    def __init__(self, base_url: Optional[str] = None, model: Optional[str] = None):
        self.base_url = (base_url or settings.OLLAMA_BASE_URL).rstrip("/")
        self.model = model or settings.OLLAMA_EMBED_MODEL

    async def check_availability(self) -> Dict[str, Any]:
        try:
            async with httpx.AsyncClient(timeout=4.0) as client:
                res = await client.get(f"{self.base_url}/api/tags")
                if res.status_code == 200:
                    models = [m["name"] for m in res.json().get("models", [])]
                    has_model = any(self.model in m or m.startswith(self.model.split(":")[0]) for m in models)
                    return {
                        "available": has_model,
                        "model": self.model,
                        "installed_models": models,
                        "message": "Model ready" if has_model else f"Model '{self.model}' not pulled yet."
                    }
                return {"available": False, "model": self.model, "message": f"Ollama HTTP {res.status_code}"}
        except Exception as e:
            return {"available": False, "model": self.model, "message": f"Cannot reach Ollama at {self.base_url}: {str(e)}"}

    async def embed_text(self, text: str) -> List[float]:
        if not text or not text.strip():
            # Return dummy zero vector if text is empty
            return [0.0] * 768

        payload = {
            "model": self.model,
            "prompt": text.strip()
        }
        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                res = await client.post(f"{self.base_url}/api/embeddings", json=payload)
                if res.status_code != 200:
                    raise AIAdapterException(f"Ollama embeddings failed ({res.status_code}): {res.text}")
                data = res.json()
                embedding = data.get("embedding")
                if not embedding:
                    raise AIAdapterException(f"No embedding returned for text: {text[:50]}")
                return embedding
        except httpx.ConnectError:
            raise AIAdapterException(f"Ollama is unreachable at {self.base_url}. Ensure 'ollama serve' is active.")
        except Exception as e:
            if isinstance(e, AIAdapterException):
                raise
            raise AIAdapterException(f"Error during embedding generation: {str(e)}")

    async def embed_batch(self, texts: List[str]) -> List[List[float]]:
        results = []
        for text in texts:
            emb = await self.embed_text(text)
            results.append(emb)
        return results


class OllamaVisionAdapter(BaseVisionAdapter):
    """Local Vision model adapter via Ollama (e.g. moondream or llava)."""

    def __init__(self, base_url: Optional[str] = None, model: Optional[str] = None):
        self.base_url = (base_url or settings.OLLAMA_BASE_URL).rstrip("/")
        self.model = model or settings.OLLAMA_VISION_MODEL

    async def check_availability(self) -> Dict[str, Any]:
        try:
            async with httpx.AsyncClient(timeout=4.0) as client:
                res = await client.get(f"{self.base_url}/api/tags")
                if res.status_code == 200:
                    models = [m["name"] for m in res.json().get("models", [])]
                    has_model = any(self.model in m or m.startswith(self.model.split(":")[0]) for m in models)
                    return {
                        "available": has_model,
                        "model": self.model,
                        "installed_models": models,
                        "message": "Model ready" if has_model else f"Vision model '{self.model}' not installed."
                    }
                return {"available": False, "model": self.model, "message": f"Ollama HTTP {res.status_code}"}
        except Exception as e:
            return {"available": False, "model": self.model, "message": f"Cannot reach Ollama at {self.base_url}: {str(e)}"}

    async def analyze_image(self, image_path: str, prompt: Optional[str] = None) -> str:
        default_prompt = (
            "Examine this archival photograph in detail. Describe the subjects, setting, "
            "objects, environment, estimated era, lighting, and any handwritten notes or notable features."
        )
        effective_prompt = prompt or default_prompt

        try:
            with open(image_path, "rb") as f:
                image_bytes = f.read()
                base64_img = base64.b64encode(image_bytes).decode("utf-8")

            payload = {
                "model": self.model,
                "prompt": effective_prompt,
                "images": [base64_img],
                "stream": False,
                "options": {"temperature": 0.2}
            }

            async with httpx.AsyncClient(timeout=90.0) as client:
                res = await client.post(f"{self.base_url}/api/generate", json=payload)
                if res.status_code != 200:
                    raise AIAdapterException(f"Ollama vision analysis failed ({res.status_code}): {res.text}")
                data = res.json()
                return data.get("response", "").strip()
        except FileNotFoundError:
            raise AIAdapterException(f"Image file not found: {image_path}")
        except httpx.ConnectError:
            raise AIAdapterException(f"Ollama unreachable at {self.base_url}. Ensure 'ollama serve' is active.")
        except Exception as e:
            if isinstance(e, AIAdapterException):
                raise
            raise AIAdapterException(f"Error during vision analysis: {str(e)}")


# Singleton instances
llm_adapter = OllamaLLMAdapter()
embedding_adapter = OllamaEmbeddingAdapter()
vision_adapter = OllamaVisionAdapter()
