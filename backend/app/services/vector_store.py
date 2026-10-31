import json
import logging
from typing import List, Dict, Any, Optional, Tuple
import numpy as np
from sqlalchemy.orm import Session
from app.models.memory import MemoryEmbedding, Memory

logger = logging.getLogger(__name__)

def cosine_similarity(v1: np.ndarray, v2: np.ndarray) -> float:
    dot = np.dot(v1, v2)
    norm_a = np.linalg.norm(v1)
    norm_b = np.linalg.norm(v2)
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return float(dot / (norm_a * norm_b))

class VectorStoreService:
    """Fast local vector store using SQLite persistence and numpy vector operations."""

    def save_embedding(
        self,
        db: Session,
        memory_id: str,
        chunk_index: int,
        chunk_text: str,
        embedding: List[float],
        model_name: str
    ) -> MemoryEmbedding:
        record = MemoryEmbedding(
            memory_id=memory_id,
            chunk_index=chunk_index,
            chunk_text=chunk_text,
            embedding_json=embedding,
            embedding_model=model_name
        )
        db.add(record)
        return record

    def search_similar_chunks(
        self,
        db: Session,
        query_embedding: List[float],
        top_k: int = 5,
        collection_id: Optional[str] = None,
        min_similarity: float = 0.25
    ) -> List[Dict[str, Any]]:
        """
        Calculates cosine similarity over all stored embeddings in the database,
        optionally filtered by collection. Returns ranked results with memory metadata.
        """
        query_vec = np.array(query_embedding, dtype=np.float32)
        
        query = db.query(MemoryEmbedding).join(Memory, MemoryEmbedding.memory_id == Memory.id)
        if collection_id:
            query = query.filter(Memory.collection_id == collection_id)
            
        embeddings_records = query.all()
        if not embeddings_records:
            return []

        ranked_results: List[Tuple[float, MemoryEmbedding, Memory]] = []

        for record in embeddings_records:
            vec = np.array(record.embedding_json, dtype=np.float32)
            sim = cosine_similarity(query_vec, vec)
            if sim >= min_similarity:
                ranked_results.append((sim, record, record.memory))

        # Sort descending by similarity score
        ranked_results.sort(key=lambda x: x[0], reverse=True)

        results = []
        for sim, emb_rec, mem in ranked_results[:top_k]:
            results.append({
                "memory_id": mem.id,
                "title": mem.title,
                "memory_type": mem.memory_type,
                "recorded_date": mem.recorded_date,
                "location": mem.location,
                "similarity_score": round(sim, 4),
                "chunk_text": emb_rec.chunk_text,
                "chunk_index": emb_rec.chunk_index
            })

        return results

vector_store = VectorStoreService()
