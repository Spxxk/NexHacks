from fastapi import APIRouter, HTTPException
from typing import List, Optional
from datetime import datetime

from models import Event, EventStatus, Ambulance, AmbulanceStatus

router = APIRouter(prefix="/events", tags=["Events"])


@router.get("", response_model=List[Event])
async def get_events(status: Optional[EventStatus] = None):
    """Get all events, optionally filtered by status."""
    if status:
        events = await Event.find(Event.status == status).to_list()
    else:
        events = await Event.find_all().to_list()
    return events


@router.post("/{event_id}/resolve")
async def resolve_event(event_id: int):
    """Mark an event as resolved and free the assigned ambulance."""
    event = await Event.get(event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    event.status = EventStatus.RESOLVED
    event.resolved_at = datetime.utcnow()
    
    # Free the ambulance
    if event.ambulance_id:
        ambulance = await Ambulance.get(event.ambulance_id)
        if ambulance:
            ambulance.status = AmbulanceStatus.IDLE
            ambulance.event_id = None
            ambulance.eta_seconds = None
            ambulance.updated_at = datetime.utcnow()
            await ambulance.save()
    
    await event.save()
    
    return {"ok": True, "event": event}
