"""Seed initial cameras, hospitals, and ambulances."""

from datetime import datetime

from database import init_db
from models import Ambulance, AmbulanceStatus, Camera, Hospital


async def seed_data():
    """Seed cameras, hospitals, and ambulances at startup."""
    await init_db()
    # Seed cameras (10 cameras)
    cameras_data = [
        {
            "id": "CAM_12",
            "lat": 40.7501,
            "lng": -73.9866,
            "latest_frame_url": "http://localhost:5055/latest_frame",
            "name": "Astra-12",
        },
        {
            "id": "CAM_18",
            "lat": 40.7488,
            "lng": -73.9848,
            "latest_frame_url": "http://localhost:5055/latest_frame",
            "name": "Astra-18",
        },
        {
            "id": "CAM_06",
            "lat": 40.7439,
            "lng": -73.9742,
            "latest_frame_url": "http://localhost:5055/latest_frame",
            "name": "Astra-06",
        },
        {
            "id": "CAM_01",
            "lat": 40.7519,
            "lng": -73.9881,
            "latest_frame_url": "http://localhost:5055/latest_frame",
            "name": "Astra-01",
        },
        {
            "id": "CAM_02",
            "lat": 40.7414,
            "lng": -73.9690,
            "latest_frame_url": "http://localhost:5055/latest_frame",
            "name": "Astra-02",
        },
        {
            "id": "CAM_03",
            "lat": 40.7495,
            "lng": -73.9874,
            "latest_frame_url": "http://localhost:5055/latest_frame",
            "name": "Astra-03",
        },
        {
            "id": "CAM_04",
            "lat": 40.7422,
            "lng": -73.9721,
            "latest_frame_url": "http://localhost:5055/latest_frame",
            "name": "Astra-04",
        },
        {
            "id": "CAM_05",
            "lat": 40.7550,
            "lng": -73.9850,
            "latest_frame_url": "http://localhost:5055/latest_frame",
            "name": "Astra-05",
        },
        {
            "id": "CAM_07",
            "lat": 40.7400,
            "lng": -73.9700,
            "latest_frame_url": "http://localhost:5055/latest_frame",
            "name": "Astra-07",
        },
        {
            "id": "CAM_08",
            "lat": 40.7520,
            "lng": -73.9800,
            "latest_frame_url": "http://localhost:5055/latest_frame",
            "name": "Astra-08",
        },
    ]

    for cam_data in cameras_data:
        existing = await Camera.get(cam_data["id"])
        if not existing:
            camera = Camera(**cam_data)
            await camera.insert()

    hospitals_data = [
        {"name": "UPMC Presbyterian", "lat": 40.4425, "lng": -79.9602},
        {"name": "UPMC Mercy", "lat": 40.4364, "lng": -79.9855},
        {"name": "Allegheny General Hospital", "lat": 40.4570, "lng": -80.0033},
    ]

    for hospital_data in hospitals_data:
        existing = await Hospital.find_one(Hospital.name == hospital_data["name"])
        if not existing:
            hospital = Hospital(**hospital_data)
            await hospital.insert()

    # Seed ambulances (one per hospital)
    for hospital_data in hospitals_data:
        existing_ambulance = await Ambulance.find_one(
            Ambulance.lat == hospital_data["lat"],
            Ambulance.lng == hospital_data["lng"],
        )
        if not existing_ambulance:
            ambulance = Ambulance(
                lat=hospital_data["lat"],
                lng=hospital_data["lng"],
                status=AmbulanceStatus.IDLE,
                updated_at=datetime.utcnow(),
            )
            await ambulance.insert()

    print(
        f"✅ Seeded {len(cameras_data)} cameras, {len(hospitals_data)} hospitals, "
        f"and {len(hospitals_data)} ambulances"
    )


if __name__ == "__main__":
    import asyncio

    asyncio.run(seed_data())
