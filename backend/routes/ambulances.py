from fastapi import APIRouter
from typing import List

from models import Ambulance

router = APIRouter(prefix="/ambulances", tags=["Ambulances"])


@router.get("", response_model=List[Ambulance])
async def get_ambulances():
    """Get all ambulances."""
    return await Ambulance.find_all().to_list()
