from enum import Enum
from typing import Optional
from beanie import Document
from bson import ObjectId
from schemas import Point

# Define ambulance status enum
class AmbulanceStatus(str, Enum):
    FREE = "free"
    GOING = "going"
    RETURNING = "returning"
    UNAVAILABLE = "unavailable"

class Ambulance(Document):
    location: Point
    event_id: ObjectId
    is_resolved: bool = False   
    eta_seconds: Optional[int] = None
    status: AmbulanceStatus = AmbulanceStatus.FREE 
    path: list[Point] = []
    
    class Settings:
        name = "ambulances"
