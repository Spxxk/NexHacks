from beanie import Document
from bson import ObjectId
from pydantic import HttpUrl
from backend.schemas import Point


class Camera(Document):
    event_ids: list[ObjectId]
    location: Point
    url: HttpUrl

    class Settings:
        name = "cameras"