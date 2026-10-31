from fastapi import APIRouter
from app.api.memories import router as memories_router
from app.api.collections import router as collections_router
from app.api.rag import router as rag_router
from app.api.ghost import router as ghost_router
from app.api.timeline import router as timeline_router
from app.api.settings import router as settings_router
from app.api.demo import router as demo_router

api_router = APIRouter()
api_router.include_router(memories_router)
api_router.include_router(collections_router)
api_router.include_router(rag_router)
api_router.include_router(ghost_router)
api_router.include_router(timeline_router)
api_router.include_router(settings_router)
api_router.include_router(demo_router)
