from typing import Optional
from enum import Enum
from pydantic import BaseModel, HttpUrl
from beanie import Document, Link
from models.location import Location
from models.camera import Camera
from models.ambulance import Ambulance

class Severity(str, Enum):
    informational = "informational"
    emergency = "emergency"

class Event(Document):
    severity: Severity
    title: str
    description: str
    reference_clip_url: HttpUrl
    location: Location
    camera_id: Link[Camera]
    ambulance_id: Optional[Link[Ambulance]] = None
    is_resolved: bool = False

    class Settings:
        name = "events"
