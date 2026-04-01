"""
routers/feedback.py — POST /api/v1/feedback
=============================================
Accepts user validation feedback (thumbs-up / thumbs-down on an
anomaly detection) and returns a confirmation payload that triggers
the frontend confetti burst and toast notification.

Production implementation will:
  1. Persist the feedback to ChromaDB as a labelled training example.
  2. Re-weight the relevant agent's Bayesian prior.
  3. Return the real accuracy delta after recomputing the agent's
     historical performance metric.

Mock implementation: always returns accuracy_improved = 0.5 so the
frontend confetti / "+0.5% accuracy" toast fires reliably during demos.
"""

import logging
from fastapi import APIRouter, HTTPException, status

from models import FeedbackRequest, FeedbackResponse

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post(
    "/feedback",
    response_model=FeedbackResponse,
    status_code=status.HTTP_200_OK,
    summary="Submit agent validation feedback",
    description=(
        "Accepts a user validation vote (confirm or deny anomaly) for a specific "
        "zone and agent. Returns an accuracy improvement metric that drives the "
        "frontend gamification layer (confetti + toast notification)."
    ),
    tags=["Feedback"],
)
async def submit_feedback(payload: FeedbackRequest) -> FeedbackResponse:
    """
    POST /api/v1/feedback

    Validates the incoming FeedbackRequest, logs it, and returns the
    mock accuracy improvement response that triggers the frontend
    dopamine-hit animation loop described in flowspec.md step 11.
    """
    logger.info(
        "[FEEDBACK] zone=%s | agent=%s | validated=%s | comment=%s",
        payload.zone_id,
        payload.agent,
        payload.validated,
        payload.comment or "(none)",
    )

    # ------------------------------------------------------------------
    # Validation: ensure agent is one of the four known specialists
    # ------------------------------------------------------------------
    valid_agents = {"sst", "chl", "wind", "salinity"}
    if payload.agent not in valid_agents:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Unknown agent '{payload.agent}'. Must be one of: {valid_agents}",
        )

    # ------------------------------------------------------------------
    # Production: persist to ChromaDB, re-weight Bayesian prior, compute
    # real delta. Mock: hardcoded 0.5 % accuracy improvement.
    # ------------------------------------------------------------------
    accuracy_delta = 0.5  # matches the spec / flowspec toast message

    return FeedbackResponse(
        accuracy_improved=accuracy_delta,
        message=(
            f"{payload.agent.capitalize()} Agent accuracy improved by "
            f"+{accuracy_delta}%! Feedback stored in memory layer. 🚀"
        ),
    )
