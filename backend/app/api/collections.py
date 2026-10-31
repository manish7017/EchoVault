from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models.memory import Collection, Memory
from app.schemas.memory import CollectionCreate, CollectionResponse

router = APIRouter(prefix="/api/collections", tags=["collections"])

@router.get("", response_model=List[CollectionResponse])
def list_collections(db: Session = Depends(get_db)):
    collections = db.query(Collection).all()
    res = []
    for c in collections:
        count = db.query(func.count(Memory.id)).filter(Memory.collection_id == c.id).scalar()
        res.append(
            CollectionResponse(
                id=c.id,
                name=c.name,
                description=c.description,
                icon=c.icon,
                color=c.color,
                created_at=c.created_at,
                memory_count=count or 0
            )
        )
    return res

@router.post("", response_model=CollectionResponse)
def create_collection(payload: CollectionCreate, db: Session = Depends(get_db)):
    existing = db.query(Collection).filter(Collection.name == payload.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Collection with this name already exists")

    col = Collection(
        name=payload.name,
        description=payload.description,
        icon=payload.icon or "folder-archive",
        color=payload.color or "#D6A65C"
    )
    db.add(col)
    db.commit()
    db.refresh(col)
    return CollectionResponse(
        id=col.id,
        name=col.name,
        description=col.description,
        icon=col.icon,
        color=col.color,
        created_at=col.created_at,
        memory_count=0
    )

@router.delete("/{id}")
def delete_collection(id: str, db: Session = Depends(get_db)):
    col = db.query(Collection).filter(Collection.id == id).first()
    if not col:
        raise HTTPException(status_code=404, detail="Collection not found")
    db.delete(col)
    db.commit()
    return {"message": "Collection deleted successfully", "id": id}
