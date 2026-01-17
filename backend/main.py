from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import uvicorn
import logging
import asyncio
import os
from dotenv import load_dotenv

from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from models import Ambulance, Event, Camera

# from seed_data import seed_data
from ambulance_mover import ambulance_mover_loop
from routes import api_router

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
load_dotenv()

async def init_db():
    """Initialize Beanie with all document models."""
    connection_string = os.getenv("MONGODB_CONNECTION_STRING")
    if not connection_string:
        raise ValueError("MONGODB_CONNECTION_STRING is not set")
    client = AsyncIOMotorClient(connection_string)
    db = client["lifeline"]
    await init_beanie(database=db, document_models=[Ambulance, Camera, Event])
    logger.info("✅ Beanie initialized")

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for startup and shutdown."""
    # Startup
    logger.info("🚀 Starting PulseCity API...")
    await init_db()
    # seed_data()
    
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
    allow_origins=["http://localhost:3000", "http://localhost:5173"],  # React dev server origins
    allow_methods=["*"],
    allow_headers=["*"]
)

app.include_router(api_router)

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
