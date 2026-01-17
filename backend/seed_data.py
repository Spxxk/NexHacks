"""Seed initial cameras, hospitals, and ambulances (wipes DB first)."""

from datetime import datetime
import logging
import os

from database import init_db
from models import Ambulance, AmbulanceStatus, Camera, Hospital
from motor.motor_asyncio import AsyncIOMotorClient

import certifi

MONGODB_CONNECTION_STRING = os.getenv(
    "MONGODB_CONNECTION_STRING",
    "mongodb+srv://owenchend_db_user:kU2F1onGsj12M0LH@cluster0.ec2quxk.mongodb.net/?appName=Cluster0&retryWrites=true&w=majority",
)
MONGODB_DATABASE_NAME = os.getenv("MONGODB_DATABASE_NAME", "lifeline")

logger = logging.getLogger(__name__)


async def seed_data():
    """Wipe and seed cameras, hospitals, and ambulances."""
    await init_db()

    # 🔹 Drop existing collections
    logger.info("🗑️ Dropping existing collections...")

    client = AsyncIOMotorClient(
        MONGODB_CONNECTION_STRING,
        tlsCAFile=certifi.where(),
        serverSelectionTimeoutMS=30000,  # 30 seconds
        connectTimeoutMS=30000,
        socketTimeoutMS=30000,
    )

    db = client[MONGODB_DATABASE_NAME]
    await db.drop_collection("cameras")
    await db.drop_collection("hospitals")
    await db.drop_collection("ambulances")

    logger.info("✅ Collections dropped, seeding data...")

    # 🔹 Seed cameras
    cameras_data = [
        {
            "lat": 40.4410,
            "lng": -79.9959,
            "latest_frame_url": "http://localhost:5055/latest_frame",
            "name": "Astra-12",
        },
        {
            "lat": 40.4445,
            "lng": -79.9932,
            "latest_frame_url": "http://localhost:5055/latest_frame",
            "name": "Astra-18",
        },
        {
            "lat": 40.4472,
            "lng": -79.9911,
            "latest_frame_url": "http://localhost:5055/latest_frame",
            "name": "Astra-06",
        },
        {
            "lat": 40.4396,
            "lng": -79.9987,
            "latest_frame_url": "http://localhost:5055/latest_frame",
            "name": "Astra-01",
        },
        {
            "lat": 40.4376,
            "lng": -79.9924,
            "latest_frame_url": "http://localhost:5055/latest_frame",
            "name": "Astra-02",
        },
        {
            "lat": 40.4429,
            "lng": -79.9905,
            "latest_frame_url": "http://localhost:5055/latest_frame",
            "name": "Astra-03",
        },
        {
            "lat": 40.4458,
            "lng": -79.9892,
            "latest_frame_url": "http://localhost:5055/latest_frame",
            "name": "Astra-04",
        },
        {
            "lat": 40.4490,
            "lng": -79.9960,
            "latest_frame_url": "http://localhost:5055/latest_frame",
            "name": "Astra-05",
        },
        {
            "lat": 40.4369,
            "lng": -79.9974,
            "latest_frame_url": "http://localhost:5055/latest_frame",
            "name": "Astra-07",
        },
        {
            "lat": 40.4438,
            "lng": -79.9836,
            "latest_frame_url": "http://localhost:5055/latest_frame",
            "name": "Astra-08",
        },
    ]

    cameras = [Camera(**cam) for cam in cameras_data]
    await Camera.insert_many(cameras)

    # 🔹 Seed hospitals
    hospitals_data = [
        {"name": "UPMC Presbyterian", "lat": 40.4425, "lng": -79.9602},
        {"name": "UPMC Mercy", "lat": 40.4364, "lng": -79.9855},
        {"name": "Allegheny General Hospital", "lat": 40.4570, "lng": -80.0033},
    ]

    hospitals = [Hospital(**hosp) for hosp in hospitals_data]
    await Hospital.insert_many(hospitals)

    # 🔹 Seed ambulances (one per hospital)
    ambulances = [
        Ambulance(
            lat=h["lat"],
            lng=h["lng"],
            status=AmbulanceStatus.IDLE,
            updated_at=datetime.utcnow(),
        )
        for h in hospitals_data
    ]
    await Ambulance.insert_many(ambulances)

    logger.info(
        f"✅ Seeded {len(cameras_data)} cameras, {len(hospitals_data)} hospitals, "
        f"and {len(hospitals_data)} ambulances"
    )


if __name__ == "__main__":
    import asyncio
    import logging

    logging.basicConfig(level=logging.INFO)
    asyncio.run(seed_data())
