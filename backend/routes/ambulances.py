from fastapi import APIRouter, Depends
from sqlmodel import Session, select
from typing import List

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from models import Ambulance
from database import get_session

router = APIRouter(prefix="/ambulances", tags=["Ambulances"])


@router.get("", response_model=List[Ambulance])
def get_ambulances(session: Session = Depends(get_session)):
    """Get all ambulances."""
    statement = select(Ambulance)
    ambulances = session.exec(statement).all()
    return ambulances
