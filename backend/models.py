from enum import Enum

from beanie import Document, PydanticObjectId
from pydantic import Field, HttpUrl
from schemas import Point


class AmbulanceStatus(str, Enum):
    FREE = "free"
    GOING = "going"
    RETURNING = "returning"
    UNAVAILABLE = "unavailable"

class Ambulance(Document):
    location: Point
    event_id: PydanticObjectId | None = None
    is_resolved: bool = False
    eta_seconds: int | None = None
    status: AmbulanceStatus = AmbulanceStatus.FREE
    path: list[Point] = Field(default_factory=list)
    
    class Settings:
        name = "ambulances"
        
class Camera(Document):
    event_ids: list[PydanticObjectId]
    location: Point
    url: HttpUrl

    class Settings:
        name = "cameras"
        
class Severity(str, Enum):
    INFORMATIONAL = "informational"
    EMERGENCY = "emergency"

class Event(Document):
    severity: Severity
    title: str
    description: str
    reference_clip_url: HttpUrl
    location: Point
    camera_id: PydanticObjectId
    ambulance_id: PydanticObjectId = None
    is_resolved: bool

    class Settings:
        name = "events"
