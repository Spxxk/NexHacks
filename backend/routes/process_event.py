from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import math
import random

from models import Event, EventStatus, Severity, Camera, Ambulance, AmbulanceStatus

router = APIRouter(tags=["Process Event"])


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
    ambulances = await Ambulance.find(Ambulance.status == AmbulanceStatus.IDLE).to_list()
    
    if not ambulances:
        return None
    
    nearest = None
    min_distance = float('inf')
    
    for ambulance in ambulances:
        distance = calculate_distance(event_lat, event_lng, ambulance.lat, ambulance.lng)
        if distance < min_distance:
            min_distance = distance
            nearest = ambulance
    
    return nearest


@router.post("/process_event")
async def process_event(request: ProcessEventRequest):
    """Main ingestion endpoint for events from AI/camera service."""
    # Get or create camera
    camera = await Camera.get(request.camera_id)
    if not camera:
        # Auto-create camera for hackathon speed
        camera = Camera(
            id=request.camera_id,
            lat=40.7501,  # Default location (can be updated later)
            lng=-73.9866,
            latest_frame_url=f"http://localhost:5055/latest_frame",
            name=request.camera_id
        )
        await camera.insert()
    
    # Add small jitter to event location (mock variation from camera)
    jitter_lat = camera.lat + random.uniform(-0.001, 0.001)
    jitter_lng = camera.lng + random.uniform(-0.001, 0.001)
    
    # Create event
    event = Event(
        severity=request.severity,
        title=request.title,
        description=request.description,
        reference_clip_url=request.reference_clip_url,
        lat=jitter_lat,
        lng=jitter_lng,
        camera_id=request.camera_id,
        status=EventStatus.OPEN,
        created_at=datetime.utcnow()
    )
    await event.insert()
    
    # If emergency, assign nearest idle ambulance
    if request.severity == Severity.EMERGENCY:
        ambulance = await find_nearest_idle_ambulance(jitter_lat, jitter_lng)
        if ambulance:
            # Calculate initial ETA
            distance = calculate_distance(jitter_lat, jitter_lng, ambulance.lat, ambulance.lng)
            eta_seconds = int((distance / 60) * 3600)  # Assume 60 km/h average speed
            
            ambulance.status = AmbulanceStatus.ENROUTE
            ambulance.event_id = event.id
            ambulance.eta_seconds = eta_seconds
            ambulance.updated_at = datetime.utcnow()
            await ambulance.save()
            
            event.ambulance_id = ambulance.id
            event.status = EventStatus.ENROUTE
            await event.save()
    
    return {"ok": True, "event": event}
