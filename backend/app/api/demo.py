from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.demo_seeder import demo_seeder
from app.services.export_service import export_service

router = APIRouter(prefix="/api/demo", tags=["demo"])

@router.post("/seed")
async def seed_demo_memories(force: bool = False, db: Session = Depends(get_db)):
    """Seed fictional demo memories into the archive for instant testing."""
    await demo_seeder.seed_sample_data_if_empty(db, force=force)
    return {"message": "Sample memories seeded successfully"}

@router.post("/reset")
async def reset_demo_memories(db: Session = Depends(get_db)):
    """Reset archive to standard fictional demo memories."""
    export_service.wipe_entire_archive(db)
    await demo_seeder.seed_sample_data_if_empty(db, force=True)
    return {"message": "Archive reset to default sample memories"}
