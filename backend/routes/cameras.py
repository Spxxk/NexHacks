from fastapi import APIRouter, HTTPException
from typing import List, Optional
from pydantic import BaseModel

from models import Camera

router = APIRouter(prefix="/cameras", tags=["Cameras"])


class RegisterCameraRequest(BaseModel):
    id: str
    lat: float
    lng: float
    latest_frame_url: str
    name: Optional[str] = None


@router.get("", response_model=List[Camera])
async def get_cameras():
    """Get all cameras."""
    cameras = await Camera.find_all().to_list()
    return cameras


@router.post("/register")
async def register_camera(request: RegisterCameraRequest):
    """Register a new camera."""
    # Check if camera already exists
    existing = await Camera.get(request.id)
    if existing:
        raise HTTPException(status_code=400, detail="Camera already exists")

    camera = Camera(
        id=request.id,
        lat=request.lat,
        lng=request.lng,
        latest_frame_url=request.latest_frame_url,
        name=request.name or request.id,
    )
    await camera.insert()

    return {"ok": True, "camera": camera}
