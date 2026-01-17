from typing import Optional
from beanie import Document, Link
from models.location import Location
from models.event import Event

# Define ambulance status enum
class AmbulanceStatus(str, Enum):
    free = "free"
    assigned = "assigned"
    unavailable = "unavailable"

class Ambulance(Document):
    location: Location
    event_id: Optional[Link[Event]] = None
    is_resolved: bool = False
    eta_seconds: Optional[int] = None
    status: AmbulanceStatus = AmbulanceStatus.free 
    

    class Settings:
        name = "ambulances"
