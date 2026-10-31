from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, distinct

from app.database import get_db
from app.models.memory import Memory, MemoryEntity, Tag
from app.schemas.memory import MemoryResponse
from app.api.memories import format_memory_response

router = APIRouter(prefix="/api/timeline", tags=["timeline"])

@router.get("")
def get_timeline(
    person: Optional[str] = Query(None),
    topic: Optional[str] = Query(None),
    memory_type: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """
    Returns memories grouped into chronological year and month clusters,
    with available filters for people, topics, and types.
    """
    q = db.query(Memory)

    if memory_type:
        q = q.filter(Memory.memory_type == memory_type)

    if person:
        q = q.join(Memory.entities).filter(
            MemoryEntity.entity_type == "person",
            MemoryEntity.entity_value.ilike(f"%{person}%")
        )

    if topic:
        q = q.join(Memory.entities).filter(
            MemoryEntity.entity_type == "topic",
            MemoryEntity.entity_value.ilike(f"%{topic}%")
        )

    memories = q.order_by(Memory.recorded_year.desc().nullslast(), Memory.recorded_date.desc().nullslast()).all()

    # Group into clusters
    clusters: Dict[str, Dict[str, Any]] = {}
    undated_memories = []

    for m in memories:
        resp = format_memory_response(m)
        if m.recorded_year:
            year_key = str(m.recorded_year)
            if year_key not in clusters:
                clusters[year_key] = {
                    "year": m.recorded_year,
                    "count": 0,
                    "months": {},
                    "memories": []
                }
            clusters[year_key]["count"] += 1
            clusters[year_key]["memories"].append(resp)

            month_key = str(m.recorded_month) if m.recorded_month else "unknown"
            if month_key not in clusters[year_key]["months"]:
                clusters[year_key]["months"][month_key] = []
            clusters[year_key]["months"][month_key].append(resp)
        else:
            undated_memories.append(resp)

    # Sorted list of year clusters
    sorted_years = sorted(clusters.values(), key=lambda x: x["year"], reverse=True)

    # Extract all distinct people and topics for filter dropdowns
    all_people = [
        p[0] for p in db.query(distinct(MemoryEntity.entity_value))
        .filter(MemoryEntity.entity_type == "person").all()
    ]
    all_topics = [
        t[0] for t in db.query(distinct(MemoryEntity.entity_value))
        .filter(MemoryEntity.entity_type == "topic").all()
    ]

    return {
        "clusters": sorted_years,
        "undated": undated_memories,
        "filter_options": {
            "people": all_people,
            "topics": all_topics
        }
    }

@router.get("/connections")
def get_memory_connections(db: Session = Depends(get_db)):
    """
    Constructs a graph (nodes and edges) showing how archived memories
    are interconnected via shared people, locations, topics, and collections.
    """
    memories = db.query(Memory).all()
    nodes = []
    node_ids = set()

    for m in memories:
        nodes.append({
            "id": m.id,
            "title": m.title,
            "type": m.memory_type,
            "date": m.recorded_date,
            "collection": m.collection.name if m.collection else None
        })
        node_ids.add(m.id)

    edges = []
    seen_pairs = set()

    # Find shared entities
    for i, m1 in enumerate(memories):
        m1_entities = {(e.entity_type, e.entity_value.lower()) for e in m1.entities}
        m1_tags = {t.name.lower() for t in m1.tags}

        for j in range(i + 1, len(memories)):
            m2 = memories[j]
            m2_entities = {(e.entity_type, e.entity_value.lower()) for e in m2.entities}
            m2_tags = {t.name.lower() for t in m2.tags}

            shared_entities = m1_entities.intersection(m2_entities)
            shared_tags = m1_tags.intersection(m2_tags)
            same_collection = (m1.collection_id and m1.collection_id == m2.collection_id)

            shared_reasons = []
            weight = 0
            for etype, evalue in shared_entities:
                shared_reasons.append(f"{etype}: {evalue}")
                weight += 2
            for stag in shared_tags:
                shared_reasons.append(f"tag: {stag}")
                weight += 1
            if same_collection:
                shared_reasons.append(f"collection: {m1.collection.name}")
                weight += 1

            if weight > 0:
                edges.append({
                    "source": m1.id,
                    "target": m2.id,
                    "weight": weight,
                    "reasons": shared_reasons[:3]
                })

    return {
        "nodes": nodes,
        "edges": edges
    }
