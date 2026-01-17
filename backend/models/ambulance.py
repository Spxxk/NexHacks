from typing import Optional
from beanie import Document, Link
from models.location import Location
from models.event import Event

# Define ambulance status enum
class AmbulanceStatus(str, Enum):
    free = "free"
    assignedGoing = "assignedGoing"
    assignedReturning = "assignedReturning"
    unavailable = "unavailable"

class Ambulance(Document):
    location: Location
    event_id: Optional[Link[Event]] = None
    is_resolved: bool = False
    eta_seconds: Optional[int] = None
    status: AmbulanceStatus = AmbulanceStatus.free 
    Path_to_event: list[Location] = []

    

    class Settings:
        name = "ambulances"
