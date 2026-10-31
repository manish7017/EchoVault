import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal
from app.models.memory import Memory

client = TestClient(app)

def test_health_check():
    res = client.get("/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert data["app"] == "EchoVault"

def test_list_memories():
    res = client.get("/api/memories")
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list)
    assert len(data) >= 5

def test_get_memory_detail():
    # Fetch first memory
    res = client.get("/api/memories")
    mem_id = res.json()[0]["id"]
    
    detail_res = client.get(f"/api/memories/{mem_id}")
    assert detail_res.status_code == 200
    data = detail_res.json()
    assert data["id"] == mem_id
    assert "extracted_text" in data
    assert "logs" in data
    assert "related_memories" in data

def test_create_manual_story():
    payload = {
        "title": "A Forgotten Lantern in the Orchard",
        "description": "Found hanging from an ancient dead apple tree in October 2012. Inside was an unsent envelope.",
        "memory_type": "story",
        "recorded_date": "2012-10-15",
        "location": "Blackwood Orchard",
        "tags": ["orchard", "lantern", "envelope"]
    }
    res = client.post("/api/memories/manual", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["title"] == payload["title"]
    assert "orchard" in data["tags"]

def test_collections_api():
    res = client.get("/api/collections")
    assert res.status_code == 200
    data = res.json()
    assert len(data) >= 3

def test_forgotten_drawer():
    res = client.get("/api/memories/forgotten")
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list)
    assert len(data) > 0

def test_system_settings_status():
    res = client.get("/api/settings/status")
    assert res.status_code == 200
    data = res.json()
    assert "models" in data
    assert "hardware_summary" in data

def test_system_storage_stats():
    res = client.get("/api/settings/storage")
    assert res.status_code == 200
    data = res.json()
    assert data["total_memories"] >= 5
