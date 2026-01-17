"""Background task to move ambulances toward their assigned events."""
import asyncio
from sqlmodel import Session, select
from datetime import datetime
import math

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))

from models import Ambulance, AmbulanceStatus, Event, EventStatus
from database import engine


def calculate_distance(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Calculate distance between two points in kilometers."""
    R = 6371  # Earth radius in km
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    a = math.sin(dlat/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlng/2)**2
    c = 2 * math.asin(math.sqrt(a))
    return R * c


def move_ambulance_toward_event(ambulance: Ambulance, event: Event, session: Session):
    """Move ambulance a small step toward the event location."""
    # Calculate direction vector
    dlat = event.lat - ambulance.lat
    dlng = event.lng - ambulance.lng
    
    # Move speed: ~0.0001 degrees per second (roughly 11 meters per second at this latitude)
    # This makes ambulances move visibly on the map
    step_size = 0.0001
    
    distance = math.sqrt(dlat**2 + dlng**2)
    if distance < step_size:
        # Close enough - mark as resolved
        event.status = EventStatus.RESOLVED
        event.resolved_at = datetime.utcnow()
        ambulance.status = AmbulanceStatus.IDLE
        ambulance.event_id = None
        ambulance.eta_seconds = None
        ambulance.lat = event.lat
        ambulance.lng = event.lng
    else:
        # Move toward event
        unit_dlat = dlat / distance
        unit_dlng = dlng / distance
        ambulance.lat += unit_dlat * step_size
        ambulance.lng += unit_dlng * step_size
        
        # Update ETA
        remaining_distance = calculate_distance(ambulance.lat, ambulance.lng, event.lat, event.lng)
        ambulance.eta_seconds = int((remaining_distance / 60) * 3600)  # 60 km/h
    
    ambulance.updated_at = datetime.utcnow()
    session.add(ambulance)
    session.add(event)
    session.commit()


async def ambulance_mover_loop():
    """Background loop that moves ambulances every second."""
    while True:
        try:
            with Session(engine) as session:
                # Find all ambulances that are enroute
                statement = select(Ambulance).where(Ambulance.status == AmbulanceStatus.ENROUTE)
                ambulances = session.exec(statement).all()
                
                for ambulance in ambulances:
                    if ambulance.event_id:
                        event = session.get(Event, ambulance.event_id)
                        if event and event.status != EventStatus.RESOLVED:
                            move_ambulance_toward_event(ambulance, event, session)
        except Exception as e:
            print(f"Error in ambulance mover loop: {e}")
        
        await asyncio.sleep(1)  # Run every 1 second
