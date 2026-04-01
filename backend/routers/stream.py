"""
routers/stream.py — WS /api/v1/agents/stream
=============================================
WebSocket endpoint that simulates the LangGraph multi-agent swarm
debate in real-time, streaming JSON messages. Includes ping heartbeat.
"""

import asyncio
import json
import logging
import random
from typing import Any

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from agents.graph import swarm_graph
from agents.nodes import get_tier

router = APIRouter()
logger = logging.getLogger(__name__)

THINKING_MESSAGES = {
    "sst": [
        "Fetching MODIS/VIIRS thermal raster from TimescaleDB...",
        "Applying STL decomposition to isolate seasonal baseline...",
    ],
    "chl": [
        "Ingesting Sentinel-3 OLCI Level-2 chlorophyll product...",
        "Comparing 8-day composite to CMEMS climatological mean...",
    ],
    "wind": [
        "Fetching ERA5 10m U/V wind components from ECMWF...",
        "Calculating Ekman transport anomaly...",
    ],
    "salinity": [
        "Querying INCOIS ERDDAP salinity streams...",
        "Running Mann-Kendall test for downward O2 trend...",
    ],
    "coordinator": [
        "All specialist votes received. Applying weighted convergence formula...",
    ],
}

AGENT_ORDER = ["sst", "chl", "wind", "salinity"]
AGENT_KEY_MAP = {
    "sst":      "sst_result",
    "chl":      "chl_result",
    "wind":     "wind_result",
    "salinity": "salinity_result",
}

async def _send(ws: WebSocket, payload: dict) -> None:
    await ws.send_text(json.dumps(payload))

@router.websocket("/agents/stream")
async def agent_stream(websocket: WebSocket):
    await websocket.accept()
    logger.info("[WS] Client connected to /api/v1/agents/stream")

    try:
        # Step 1: Execute graph via sync inference
        initial_state = {
            "zone_id":          "AS-07",
            "cloud_cover_days": 0,
            "sst_result":      {},
            "chl_result":      {},
            "wind_result":     {},
            "salinity_result": {},
            "final_score":     0,
            "mission_debrief": "",
        }

        logger.info("[WS] Invoking LangGraph swarm for zone AS-07...")
        result: dict = swarm_graph.invoke(initial_state)
        
        # FIX 5: Determine score and tier from the graph result properly
        f_score = result.get("final_score", 0)
        f_tier = get_tier(f_score)

        # Step 2: Stream updates for each agent sequence (thinking then voting)
        for agent_key in AGENT_ORDER:
            agent_result = result[AGENT_KEY_MAP[agent_key]]
            thinking_msg = random.choice(THINKING_MESSAGES[agent_key])
            
            await _send(websocket, {
                "type":    "agent_update",
                "agent":   agent_key,
                "status":  "thinking",
                "message": thinking_msg,
                "zone_id": "AS-07"
            })
            await asyncio.sleep(0.5)

            await _send(websocket, {
                "type":    "agent_update",
                "agent":   agent_key,
                "status":  "voting",
                "message": f"{agent_key.upper()} agent vote cast.",
                "data": {
                    "confidence": agent_result["confidence"],
                    "reading":    agent_result["reading"],
                },
                "zone_id": "AS-07"
            })
            await asyncio.sleep(0.3)

        # Step 3: Coordinator 
        coordinator_msg = random.choice(THINKING_MESSAGES["coordinator"])
        await _send(websocket, {
            "type":    "agent_update",
            "agent":   "coordinator",
            "status":  "thinking",
            "message": coordinator_msg,
            "zone_id": "AS-07",
        })
        await asyncio.sleep(1.0)

        # Step 4: Final Complete — parse debrief and ensure tier/score are consistent
        try:
            debrief_data = json.loads(result["mission_debrief"])
        except Exception:
            debrief_data = {"error": "Failed to parse json", "raw": result["mission_debrief"]}

        # FIX 5: Ensure tier and score in debrief_data match the coordinator's calculation
        debrief_data["score"] = f_score
        debrief_data["tier"] = f_tier

        await _send(websocket, {
            "type":            "coordinator_complete",
            "agent":           "coordinator",
            "message":         "Mission debrief ready.",
            "final_score":     f_score,
            "mission_debrief": debrief_data,
            "zone_id":         "AS-07",
            # Spread the debrief fields at top level too for compatibility
            "score":           f_score,
            "tier":            f_tier,
            "situation_summary": debrief_data.get("situation_summary", ""),
            "agent_breakdown":   debrief_data.get("agent_breakdown", ""),
            "outlook_48hr":      debrief_data.get("outlook_48hr", ""),
            "recommended_action": debrief_data.get("recommended_action", ""),
        })
        
        # --- WebSocket Heartbeat loop ---
        # Instead of closing, keep connection alive with ping/pong every 20s
        while True:
            await asyncio.sleep(20)
            await _send(websocket, {"type": "ping"})

    except WebSocketDisconnect:
        logger.info("[WS] Client disconnected.")
    except Exception as exc:
        logger.error("[WS] Unexpected error: %s", exc, exc_info=True)
