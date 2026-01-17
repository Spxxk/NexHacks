from enum import Enum
from pydantic import HttpUrl
from beanie import Document
from schemas import Point
from bson.objectid import ObjectId

class Severity(str, Enum):
    INFORMATIONAL = "informational"
    EMERGENCY = "emergency"

class Event(Document):
    severity: Severity
    title: str
    description: str
    reference_clip_url: HttpUrl
    location: Point
    camera_id: ObjectId
    ambulance_id: ObjectId = None
    is_resolved: bool

    class Settings:
        name = "events"
