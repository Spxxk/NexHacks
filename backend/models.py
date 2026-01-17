from beanie import Document
from typing import Optional
from datetime import datetime
from enum import Enum


class Severity(str, Enum):
    INFORMATIONAL = "informational"
    EMERGENCY = "emergency"


class EventStatus(str, Enum):
    OPEN = "open"
    ENROUTE = "enroute"
    RESOLVED = "resolved"


class AmbulanceStatus(str, Enum):
    IDLE = "idle"
    ENROUTE = "enroute"
    UNAVAILABLE = "unavailable"


class Camera(Document):
    id: str  # Custom string ID
    lat: float
    lng: float
    latest_frame_url: str
    name: Optional[str] = None

    class Settings:
        name = "cameras"
        use_cache = False


class Event(Document):
    severity: Severity
    title: str
    description: str
    reference_clip_url: str
    lat: float
    lng: float
    camera_id: str
    ambulance_id: Optional[int] = None
    status: EventStatus = EventStatus.OPEN
    created_at: datetime
    resolved_at: Optional[datetime] = None

    class Settings:
        name = "events"


class Ambulance(Document):
    lat: float
    lng: float
    status: AmbulanceStatus = AmbulanceStatus.IDLE
    event_id: Optional[int] = None
    eta_seconds: Optional[int] = None
    updated_at: datetime

    class Settings:
        name = "ambulances"
