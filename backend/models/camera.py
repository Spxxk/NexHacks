from beanie import Document
from pydantic import HttpUrl
from backend.schemas import Point


class Camera(Document):
    location: Point
    url: HttpUrl

    class Settings:
        name = "cameras"