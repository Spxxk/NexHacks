from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import math

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from models import Event, EventStatus, Severity, Camera, Ambulance, AmbulanceStatus
from database import get_session

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


def find_nearest_idle_ambulance(event_lat: float, event_lng: float, session: Session) -> Optional[Ambulance]:
    """Find the nearest idle ambulance to the event location."""
    statement = select(Ambulance).where(Ambulance.status == AmbulanceStatus.IDLE)
    ambulances = session.exec(statement).all()
    
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
def process_event(
    request: ProcessEventRequest,
    session: Session = Depends(get_session)
):
    """Main ingestion endpoint for events from AI/camera service."""
    # Get or create camera
    camera = session.get(Camera, request.camera_id)
    if not camera:
        # Auto-create camera for hackathon speed
        camera = Camera(
            id=request.camera_id,
            lat=40.7501,  # Default location (can be updated later)
            lng=-73.9866,
            latest_frame_url=f"http://localhost:5055/latest_frame",
            name=request.camera_id
        )
        session.add(camera)
        session.commit()
        session.refresh(camera)
    
    # Add small jitter to event location (mock variation from camera)
    import random
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
        status=EventStatus.OPEN
    )
    session.add(event)
    session.commit()
    session.refresh(event)
    
    # If emergency, assign nearest idle ambulance
    if request.severity == Severity.EMERGENCY:
        ambulance = find_nearest_idle_ambulance(jitter_lat, jitter_lng, session)
        if ambulance:
            # Calculate initial ETA (distance in km / 60 km/h * 3600 = seconds)
            distance = calculate_distance(jitter_lat, jitter_lng, ambulance.lat, ambulance.lng)
            eta_seconds = int((distance / 60) * 3600)  # Assume 60 km/h average speed
            
            ambulance.status = AmbulanceStatus.ENROUTE
            ambulance.event_id = event.id
            ambulance.eta_seconds = eta_seconds
            ambulance.updated_at = datetime.utcnow()
            
            event.ambulance_id = ambulance.id
            event.status = EventStatus.ENROUTE
            
            session.add(ambulance)
            session.add(event)
            session.commit()
            session.refresh(event)
            session.refresh(ambulance)
    
    return {"ok": True, "event": event}
