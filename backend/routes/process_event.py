from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
import math
import random

from beanie import PydanticObjectId
from models import Camera, Event, Severity, Ambulance, AmbulanceStatus
from schemas import Point

router = APIRouter(tags=["Events"])


class ProcessEventRequest(BaseModel):
    camera_id: str
    severity: Severity
    title: str
    description: str
    reference_clip_url: str


def calculate_distance(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Calculate distance between two points in kilometers (Haversine formula)."""
    R = 6371  # Earth radius in km
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    a = math.sin(dlat/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlng/2)**2
    c = 2 * math.asin(math.sqrt(a))
    return R * c


async def find_nearest_idle_ambulance(event_lat: float, event_lng: float) -> Optional[Ambulance]:
    """Find the nearest idle ambulance to the event location."""
    ambulances = await Ambulance.find(Ambulance.status == AmbulanceStatus.FREE).to_list()

    if not ambulances:
        return None

    nearest = None
    min_distance = float("inf")

    for ambulance in ambulances:
        distance = calculate_distance(event_lat, event_lng, ambulance.location.lat, ambulance.location.lng)
        if distance < min_distance:
            min_distance = distance
            nearest = ambulance

    return nearest


@router.post("/process_event")
async def process_event(request: ProcessEventRequest):
    """Main ingestion endpoint for events from AI/camera service."""
    camera = None
    try:
        camera = await Camera.get(PydanticObjectId(request.camera_id))
    except Exception:
        camera = None

    if not camera:
        camera = Camera(
            location=Point(lat=40.7501, lng=-73.9866),
            url="http://localhost:5055/latest_frame",
            event_ids=[],
        )
        await camera.insert()

    jitter_lat = camera.location.lat + random.uniform(-0.001, 0.001)
    jitter_lng = camera.location.lng + random.uniform(-0.001, 0.001)

    event = Event(
        severity=request.severity,
        title=request.title,
        description=request.description,
        reference_clip_url=request.reference_clip_url,
        location=Point(lat=jitter_lat, lng=jitter_lng),
        camera_id=camera.id,
        ambulance_id=None,
        is_resolved=False,
    )
    await event.insert()

    camera.event_ids.append(event.id)
    await camera.save()

    if request.severity == Severity.EMERGENCY:
        ambulance = await find_nearest_idle_ambulance(jitter_lat, jitter_lng)
        if ambulance:
            distance = calculate_distance(
                jitter_lat,
                jitter_lng,
                ambulance.location.lat,
                ambulance.location.lng,
            )
            eta_seconds = int((distance / 60) * 3600)
            ambulance.status = AmbulanceStatus.GOING
            ambulance.event_id = event.id
            ambulance.eta_seconds = eta_seconds
            await ambulance.save()

            event.ambulance_id = ambulance.id
            await event.save()

    return {"ok": True, "event": event}
