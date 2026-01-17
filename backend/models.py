from sqlmodel import SQLModel, Field
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


class Camera(SQLModel, table=True):
    id: str = Field(primary_key=True)
    lat: float
    lng: float
    latest_frame_url: str
    name: Optional[str] = None


class Event(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    severity: Severity
    title: str
    description: str
    reference_clip_url: str
    lat: float
    lng: float
    camera_id: str
    ambulance_id: Optional[int] = None
    status: EventStatus = EventStatus.OPEN
    created_at: datetime = Field(default_factory=datetime.utcnow)
    resolved_at: Optional[datetime] = None


class Ambulance(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    lat: float
    lng: float
    status: AmbulanceStatus = AmbulanceStatus.IDLE
    event_id: Optional[int] = None
    eta_seconds: Optional[int] = None
    updated_at: datetime = Field(default_factory=datetime.utcnow)
