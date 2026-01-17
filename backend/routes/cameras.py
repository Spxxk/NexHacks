from fastapi import APIRouter, HTTPException
from typing import List, Optional
from pydantic import BaseModel
from beanie import PydanticObjectId

from models import Camera
from schemas import Point

router = APIRouter(prefix="/cameras", tags=["Cameras"])


class RegisterCameraRequest(BaseModel):
    location: Point
    url: str
    event_ids: Optional[list[PydanticObjectId]] = None


@router.get("", response_model=List[Camera])
async def get_cameras():
    """Get all cameras."""
    return await Camera.find_all().to_list()


@router.post("/register")
async def register_camera(request: RegisterCameraRequest):
    """Register a new camera."""
    camera = Camera(
        location=request.location,
        url=request.url,
        event_ids=request.event_ids or [],
    )
    await camera.insert()
    return {"ok": True, "camera": camera}
