import pytest
from app.database import SessionLocal
from app.services.vector_store import vector_store, cosine_similarity
from app.models.memory import Memory, MemoryEmbedding
import numpy as np

def test_cosine_similarity():
    v1 = np.array([1.0, 0.0, 0.0])
    v2 = np.array([1.0, 0.0, 0.0])
    assert abs(cosine_similarity(v1, v2) - 1.0) < 1e-5

    v3 = np.array([0.0, 1.0, 0.0])
    assert abs(cosine_similarity(v1, v3) - 0.0) < 1e-5

def test_vector_search_seeded_memories():
    db = SessionLocal()
    try:
        # Query for attic / brass key
        query_vec = [0.1] * 768
        results = vector_store.search_similar_chunks(db, query_embedding=query_vec, top_k=3, min_similarity=-1.0)
        assert len(results) > 0
        assert "memory_id" in results[0]
        assert "title" in results[0]
    finally:
        db.close()
