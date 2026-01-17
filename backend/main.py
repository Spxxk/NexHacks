from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from beanie import init_beanie, Document
import motor.motor_asyncio
import certifi
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Define a sample Beanie Document (MongoDB collection model)
class City(Document):
    name: str
    country: str

    class Settings:
        name = "cities"  # collection name in MongoDB

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

@app.get("/", tags=["Root"])
async def read_root():
    return {"message": "Welcome to PulseCity API!"}

@app.get("/cities", tags=["Cities"])
async def get_cities():
    """Get all cities from the database."""
    cities = await City.find_all().to_list()
    return cities

@app.post("/cities", tags=["Cities"])
async def create_city(city: City):
    """Create a new city."""
    await city.insert()
    return city
