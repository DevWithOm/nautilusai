"""
routers/zones.py — GET /api/v1/zones
=====================================
Returns a list of 25 monitoring zones covering India's EEZ.
"""

from fastapi import APIRouter
from typing import List

from models import Zone, AgentVotes, AgentReading

router = APIRouter()

def _make_agent_votes(
    sst_conf: int,   sst_reading: str,
    chl_conf: int,   chl_reading: str,
    wind_conf: int,  wind_reading: str,
    sal_conf: int,   sal_reading: str,
) -> AgentVotes:
    """Helper to build an AgentVotes object from individual readings."""
    return AgentVotes(
        sst=AgentReading(confidence=sst_conf, reading=sst_reading),
        chl=AgentReading(confidence=chl_conf, reading=chl_reading),
        wind=AgentReading(confidence=wind_conf, reading=wind_reading),
        salinity=AgentReading(confidence=sal_conf, reading=sal_reading),
    )

def _build_zone(id: str, lat: float, lng: float, region: str) -> Zone:
    return Zone(
        zone_id=id,
        lat=lat,
        lng=lng,
        score=0,          # Start 0, updated by coordinator
        tier="normal",    # Start normal, updated by coordinator
        # The frontend expects these fields for map popups
        name=id,
        region=region,
        agents=_make_agent_votes(
            sst_conf=0, sst_reading="N/A",
            chl_conf=0, chl_reading="N/A",
            wind_conf=0, wind_reading="N/A",
            sal_conf=0, sal_reading="N/A"
        ),
        data_confidence=0.9,
        cloud_cover_days=0
    )


# The 25 zones covering India's full maritime territory
ALL_ZONES_CONFIG = [
  # Arabian Sea — West Coast
  ("AS-07", 14.8, 72.1, "Arabian Sea"),
  ("AS-01", 18.5, 66.2, "Arabian Sea"),
  ("AS-02", 20.1, 65.8, "Arabian Sea"),
  ("AS-03", 16.2, 65.5, "Arabian Sea"),
  ("MH-01", 19.8, 70.2, "Maharashtra Coast"),
  ("MH-02", 17.2, 71.5, "Maharashtra Coast"),
  ("GUJ-01", 22.5, 68.2, "Gujarat Coast"),
  ("GUJ-02", 21.8, 67.5, "Gujarat Coast"),
  ("KAR-01", 13.5, 73.2, "Karnataka Coast"),
  ("KAR-02", 14.2, 74.1, "Karnataka Coast"),
  ("KER-01", 10.8, 75.1, "Kerala Coast"),
  ("KER-02", 9.5, 76.2, "Kerala Coast"),
  ("LKS-01", 11.2, 72.8, "Lakshadweep Sea"),
  ("LKS-02", 10.5, 71.5, "Lakshadweep Sea"),
  # Bay of Bengal — East Coast
  ("BOB-01", 15.5, 82.5, "Bay of Bengal"),
  ("BOB-02", 13.2, 81.8, "Bay of Bengal"),
  ("BOB-03", 17.8, 83.5, "Bay of Bengal"),
  ("BOB-04", 20.2, 87.2, "Bay of Bengal"),
  ("BOB-05", 12.5, 80.5, "Bay of Bengal"),
  ("AND-01", 12.8, 93.2, "Andaman Sea"),
  ("AND-02", 11.5, 92.8, "Andaman Sea"),
  ("GOB-01", 14.8, 80.2, "Gulf of Mannar"),
  ("PAL-01", 10.2, 79.8, "Palk Strait"),
  ("IO-01", 8.5, 75.5, "Indian Ocean"),
  ("IO-02", 6.8, 73.2, "Indian Ocean"),
]

MOCK_ZONES: List[Zone] = [
    _build_zone(z[0], z[1], z[2], z[3]) for z in ALL_ZONES_CONFIG
]

# ---------------------------------------------------------------------------
# Endpoint
# ---------------------------------------------------------------------------
@router.get(
    "/zones",
    response_model=List[Zone],
    summary="List monitoring zones",
    description="Returns all 25 monitoring zones.",
    tags=["Zones"],
)
async def list_zones() -> List[Zone]:
    """
    GET /api/v1/zones
    """
    return MOCK_ZONES
