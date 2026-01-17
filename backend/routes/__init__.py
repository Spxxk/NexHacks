from fastapi import APIRouter

from .root import router as root_router
from .cities import router as cities_router

api_router = APIRouter()
api_router.include_router(root_router)
api_router.include_router(cities_router)
