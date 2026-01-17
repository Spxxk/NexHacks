from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from typing import List, Optional
from pydantic import BaseModel

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from models import Camera
from database import get_session

router = APIRouter(prefix="/cameras", tags=["Cameras"])


class RegisterCameraRequest(BaseModel):
    id: str
    lat: float
    lng: float
    latest_frame_url: str
    name: Optional[str] = None


@router.get("", response_model=List[Camera])
def get_cameras(session: Session = Depends(get_session)):
    """Get all cameras."""
    statement = select(Camera)
    cameras = session.exec(statement).all()
    return cameras


@router.post("/register")
def register_camera(
    request: RegisterCameraRequest,
    session: Session = Depends(get_session)
):
    """Register a new camera."""
    # Check if camera already exists
    existing = session.get(Camera, request.id)
    if existing:
        raise HTTPException(status_code=400, detail="Camera already exists")
    
    camera = Camera(
        id=request.id,
        lat=request.lat,
        lng=request.lng,
        latest_frame_url=request.latest_frame_url,
        name=request.name or request.id
    )
    session.add(camera)
    session.commit()
    session.refresh(camera)
    
    return {"ok": True, "camera": camera}
