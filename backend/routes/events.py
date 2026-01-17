from fastapi import APIRouter, HTTPException
from typing import List
from beanie import PydanticObjectId
from models import Event
from models import Ambulance, AmbulanceStatus

router = APIRouter(prefix="/events", tags=["Events"])


@router.get("", response_model=List[Event])
async def get_events():
    """Get all events."""
    return await Event.find_all().to_list()


@router.post("/{event_id}/resolve")
async def resolve_event(event_id: str):
    """Mark an event as resolved and free the assigned ambulance."""
    event = await Event.get(PydanticObjectId(event_id))
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    event.is_resolved = True
    await event.save()

    if event.ambulance_id:
        ambulance = await Ambulance.get(event.ambulance_id)
        if ambulance:
            ambulance.status = AmbulanceStatus.FREE
            ambulance.event_id = None
            ambulance.eta_seconds = None
            await ambulance.save()

    return {"ok": True, "event": event}
