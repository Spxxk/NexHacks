from fastapi import APIRouter

from models import City

router = APIRouter(prefix="/cities", tags=["Cities"])


@router.get("")
async def get_cities():
    """Get all cities from the database."""
    cities = await City.find_all().to_list()
    return cities


@router.post("")
async def create_city(city: City):
    """Create a new city."""
    await city.insert()
    return city
