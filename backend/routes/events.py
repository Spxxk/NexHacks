from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from typing import List, Optional
from datetime import datetime

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from models import Event, EventStatus, Ambulance, AmbulanceStatus
from database import get_session

router = APIRouter(prefix="/events", tags=["Events"])


@router.get("", response_model=List[Event])
def get_events(
    status: Optional[EventStatus] = None,
    session: Session = Depends(get_session)
):
    """Get all events, optionally filtered by status."""
    statement = select(Event)
    if status:
        statement = statement.where(Event.status == status)
    events = session.exec(statement).all()
    return events


@router.post("/{event_id}/resolve")
def resolve_event(
    event_id: int,
    session: Session = Depends(get_session)
):
    """Mark an event as resolved and free the assigned ambulance."""
    event = session.get(Event, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    event.status = EventStatus.RESOLVED
    event.resolved_at = datetime.utcnow()
    
    # Free the ambulance
    if event.ambulance_id:
        ambulance = session.get(Ambulance, event.ambulance_id)
        if ambulance:
            ambulance.status = AmbulanceStatus.IDLE
            ambulance.event_id = None
            ambulance.eta_seconds = None
            ambulance.updated_at = datetime.utcnow()
    
    session.add(event)
    session.commit()
    session.refresh(event)
    
    return {"ok": True, "event": event}
