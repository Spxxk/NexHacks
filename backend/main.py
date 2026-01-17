from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import uvicorn
import logging
import asyncio

from database import init_db
from seed_data import seed_data
from ambulance_mover import ambulance_mover_loop
from routes import api_router

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(_app: FastAPI):
    """Lifespan context manager for startup and shutdown."""
    # Startup
    logger.info("🚀 Starting Lifeline...")
    await init_db()

    # Start ambulance mover loop in background
    mover_task = asyncio.create_task(ambulance_mover_loop())
    logger.info("✅ Ambulance mover loop started")

    yield

    # Shutdown
    mover_task.cancel()
    try:
        await mover_task
    except asyncio.CancelledError:
        pass
    logger.info("👋 Shutting down...")


app = FastAPI(lifespan=lifespan)

# Enable CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],  # React dev server origins
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
