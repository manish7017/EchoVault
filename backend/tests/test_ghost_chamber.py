import pytest
from app.database import SessionLocal
from app.models.ghost_story import GhostStory
from app.models.memory import Memory

def test_ghost_stories_list_and_sample():
    db = SessionLocal()
    try:
        stories = db.query(GhostStory).all()
        assert len(stories) >= 1
        sample_story = stories[0]
        assert sample_story.disclaimer is not None
        assert "Fictional interpretation" in sample_story.disclaimer
        assert sample_story.title is not None
        assert len(sample_story.story_text) > 50
    finally:
        db.close()
