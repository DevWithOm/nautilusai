"""
models.py — NautilusAI Pydantic Schemas
=======================================
These data models match the JSON schemas defined in spec.md Section 5.
They are used for request/response validation and serialization across
all API endpoints.
"""

from pydantic import BaseModel, Field
from typing import Optional, Literal


# ---------------------------------------------------------------------------
# Agent-level reading: one specialist agent's output for a given zone.
# ---------------------------------------------------------------------------
class AgentReading(BaseModel):
    """
    Represents the analysis produced by a single specialist agent.
    - confidence: integer 0–100 reflecting data quality + model certainty
    - reading:    human-readable measured delta (e.g., "+2.9°C", "-38%")
    """
    confidence: int = Field(..., ge=0, le=100, description="Confidence score 0–100")
    reading: str = Field(..., description="Human-readable sensor reading delta")


# ---------------------------------------------------------------------------
# Agent vote block: the four specialist readings bundled together.
# ---------------------------------------------------------------------------
class AgentVotes(BaseModel):
    """
    Encapsulates the readings (and implicitly, votes) of all four
    specialist agents for a single zone analysis.
    """
    sst:      AgentReading  # Sea Surface Temperature agent
    chl:      AgentReading  # Chlorophyll-a agent
    wind:     AgentReading  # Wind / physical forcing agent
    salinity: AgentReading  # Salinity / dissolved-O₂ agent


# ---------------------------------------------------------------------------
# Zone: the core monitoring unit returned by GET /api/v1/zones
# ---------------------------------------------------------------------------
class Zone(BaseModel):
    """
    A single monitoring zone with its current anomaly assessment.
    - zone_id:         Unique identifier (e.g., "AS-07")
    - lat / lng:       Geographic centre of the zone
    - score:           Weighted convergence score 0–100
    - tier:            Severity classification driven by the score
    - agents:          The four specialist agent readings
    - data_confidence: Overall data quality metric (0.0–1.0)
    - cloud_cover_days: Days of cloud obstruction in rolling window
    """
    zone_id:          str = Field(..., description="Unique zone identifier, e.g. 'AS-07'")
    lat:              float = Field(..., description="Zone centroid latitude")
    lng:              float = Field(..., description="Zone centroid longitude")
    score:            int = Field(..., ge=0, le=100, description="Convergence score 0–100")
    tier:             Literal["normal", "watch", "advisory", "critical"] = Field(
        ..., description="Threat classification tier"
    )
    agents:           AgentVotes = Field(..., description="Four specialist agent readings")
    data_confidence:  float = Field(..., ge=0.0, le=1.0, description="Data quality metric")
    cloud_cover_days: int = Field(..., ge=0, description="Cloud-obstructed days in window")


# ---------------------------------------------------------------------------
# WebSocket stream message: events emitted during the LangGraph debate
# ---------------------------------------------------------------------------
class StreamMessage(BaseModel):
    """
    A single JSON frame pushed over the WebSocket during a swarm debate.

    Stages (type field):
      "thinking"  — A specialist agent is analysing data (incremental updates)
      "voting"    — A specialist agent has finished and casts its confidence vote
      "complete"  — Coordinator has resolved; includes Gemini mission_debrief

    Optional fields are absent unless relevant to the stage.
    """
    type:           Literal["thinking", "voting", "complete"] = Field(
        ..., description="Lifecycle stage of the swarm debate"
    )
    agent:          Optional[str] = Field(
        None, description="Agent emitting this event (sst|chl|wind|salinity|coordinator)"
    )
    message:        Optional[str] = Field(
        None, description="Free-text status or thought string"
    )
    data:           Optional[AgentReading] = Field(
        None, description="Agent reading snapshot (present during 'voting' stage)"
    )
    final_score:    Optional[int] = Field(
        None, description="Coordinator convergence score (present at 'complete' stage)"
    )
    mission_debrief: Optional[str] = Field(
        None, description="Gemini-generated ecological debrief (present at 'complete' stage)"
    )
    zone_id:        Optional[str] = Field(
        None, description="Zone being analysed"
    )


# ---------------------------------------------------------------------------
# Feedback: POST /api/v1/feedback request body
# ---------------------------------------------------------------------------
class FeedbackRequest(BaseModel):
    """
    User validation feedback tied to a specific zone and agent.
    Sent to ChromaDB to improve future Bayesian priors.
    """
    zone_id:    str = Field(..., description="Zone the user is validating")
    agent:      str = Field(..., description="Agent being rated (sst|chl|wind|salinity)")
    validated:  bool = Field(..., description="True = confirm threat, False = deny")
    comment:    Optional[str] = Field(None, description="Optional free-text user note")


# ---------------------------------------------------------------------------
# Feedback response: triggers the frontend confetti / toast
# ---------------------------------------------------------------------------
class FeedbackResponse(BaseModel):
    """
    Returned after persisting user feedback.
    accuracy_improved drives the frontend confetti + toast notification.
    """
    accuracy_improved: float = Field(
        ..., description="Percentage accuracy gain after feedback integration"
    )
    message:           str = Field(
        ..., description="Human-readable confirmation string"
    )
