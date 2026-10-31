import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.database import engine, Base, SessionLocal
from app.api import api_router
from app.services.demo_seeder import demo_seeder

# Configure Logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("echovault")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing EchoVault database and models...")
    Base.metadata.create_all(bind=engine)
    
    # Check and seed fictional sample archive if empty
    db = SessionLocal()
    try:
        await demo_seeder.seed_sample_data_if_empty(db)
    except Exception as e:
        logger.warning(f"Initial sample seeding deferred: {e}")
    finally:
        db.close()

    yield

    logger.info("EchoVault shutting down...")

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    description="The Memories That Refuse to Disappear — Privacy-first, local digital archive",
    lifespan=lifespan
)

# CORS Middleware for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # local-first
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API routes
app.include_router(api_router)

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "version": settings.VERSION,
        "tagline": settings.TAGLINE
    }
