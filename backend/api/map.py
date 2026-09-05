from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/api/map", tags=["map"])


class Location(BaseModel):
    id: int
    name: str
    type: str  # Hospital | Shelter | Resource | FloodZone
    lat: float
    lng: float
    status: str
    capacity: int


LOCATIONS: list[Location] = [
    Location(id=1, name="Kochi Medical Center", type="Hospital", lat=9.9312, lng=76.2673, status="Operational", capacity=450),
    Location(id=2, name="Thiruvananthapuram General Hospital", type="Hospital", lat=8.5241, lng=76.9366, status="Operational", capacity=600),
    Location(id=3, name="Kottayam District Hospital", type="Hospital", lat=9.5916, lng=76.5222, status="Operational", capacity=320),
    Location(id=4, name="Alappuzha Relief Shelter", type="Shelter", lat=9.4981, lng=76.3388, status="Operational", capacity=800),
    Location(id=5, name="Kottarakkara Relief Camp", type="Shelter", lat=9.0000, lng=76.7800, status="Operational", capacity=500),
    Location(id=6, name="Thrissur Shelter Hub", type="Shelter", lat=10.5276, lng=76.2144, status="Operational", capacity=650),
    Location(id=7, name="Ernakulam Resource Center", type="Resource", lat=9.9816, lng=76.2999, status="Operational", capacity=200),
    Location(id=8, name="Palakkad Supply Depot", type="Resource", lat=10.7867, lng=76.6548, status="Operational", capacity=300),
    Location(id=9, name="Pathanamthitta Flood Zone", type="FloodZone", lat=9.2648, lng=76.7870, status="Monitoring", capacity=0),
    Location(id=10, name="Idukki Flood Zone", type="FloodZone", lat=9.9189, lng=77.1025, status="Monitoring", capacity=0),
]


@router.get("/locations", response_model=list[Location])
def get_locations():
    return LOCATIONS
