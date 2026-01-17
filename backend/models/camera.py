from typing import List
from pydantic import BaseModel, HttpUrl
from beanie import Document, Link
from models.location import Location
from models.event import Event

class Camera(Document):
    events: List[Link[Event]] = []
    location: Location
    url: HttpUrl

    class Settings:
        name = "cameras"