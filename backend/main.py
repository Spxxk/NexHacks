from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from beanie import init_beanie
import motor.motor_asyncio
import certifi
import os
from dotenv import load_dotenv
import uvicorn

from models import City
from routes import api_router

# Load environment variables from .env file
load_dotenv()

app = FastAPI()

# Enable CORS for local development (allow React frontend on localhost to call this API)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React dev server origin
    allow_methods=["*"],
    allow_headers=["*"]
)

@app.on_event("startup")
async def startup_db():
    """Initialize database connection and Beanie on startup."""
    mongodb_connection_string = os.getenv("MONGODB_CONNECTION_STRING")
    database_name = os.getenv("MONGODB_DATABASE_NAME", "pulsecity")
    
    if not mongodb_connection_string:
        raise ValueError("MONGODB_CONNECTION_STRING environment variable is not set")
    
    client = motor.motor_asyncio.AsyncIOMotorClient(
        mongodb_connection_string,
        tlsCAFile=certifi.where()
    )
    await init_beanie(database=client[database_name], document_models=[City])

app.include_router(api_router)

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
