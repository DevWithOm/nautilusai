# NautilusAI: Master System Specification (spec.md)
**Theme/Edition:** Living Ocean Explorer 

## 1. System Overview
NautilusAI is an interactive ecological mapping platform designed to monitor marine anomalies. Instead of a traditional threat-radar, it operates as a high-tech, gamified environmental sentinel. The backend powers a real-time multi-agent swarm that debates satellite data, streaming its "thoughts" to a highly interactive 3D React frontend.

---

## 2. Global Tech Stack (Backend)
* **Framework:** Python 3.11+ with FastAPI.
* **AI Orchestration:** LangGraph (for stateful multi-agent routing) & LangChain.
* **Coordinator LLM:** Google Gemini 1.5 Pro (`google-genai` SDK).
* **Databases:**
  * TimescaleDB / PostGIS (Relational & Spatial time-series data).
  * ChromaDB (Vector memory for the gamified Bayesian feedback loop).
* **Data Processing:** `pandas`, `xarray`, `statsmodels` (STL decomposition).

---

## 3. Data Ingestion Layer
The system runs automated daily cron jobs to fetch data from the following APIs:
1. **NASA Earthdata API:** MODIS/VIIRS Sea Surface Temperature (SST).
2. **Copernicus Marine (CMEMS):** Sentinel-3 OLCI data for Chlorophyll-a.
3. **ECMWF / CDSAPI (ERA5):** Reanalysis wind data (10m u/v components) to track physical forcing.
4. **INCOIS ERDDAP:** Regional salinity and dissolved O₂ data.

---

## 4. Multi-Agent Swarm Logic (LangGraph)
The intelligence layer consists of 4 specialist agents and 1 coordinator. No single agent can trigger an anomaly alone.

### The 4 Specialist Nodes:
* **Agent 1 (SST):** Calculates thermal residuals against seasonal baselines.
* **Agent 2 (Chlorophyll):** Tracks biological markers (e.g., algal blooms or suppression).
* **Agent 3 (Wind):** Evaluates physical forcing (e.g., drops in upwelling winds).
* **Agent 4 (Salinity):** Monitors downward O₂ trends / salinity spikes.

### The Coordinator Node:
* Waits for all 4 agents to execute and vote.
* Evaluates overall data confidence, penalizing the score if `cloud_cover_days` exceeds the `.env` threshold.
* Applies the weighted convergence formula:
  $Score = \alpha(magnitude) + \beta(duration) + \gamma(convergence) + \delta(history\_match)$
* If $Score > 75$, it triggers **Gemini 1.5 Pro** to query ChromaDB for historical context and generate a human-readable ecological Mission Debrief.

---

## 5. API Endpoints & Data Schemas

### A. `GET /api/v1/zones`
Returns the 47 monitoring zones and current anomaly data for the frontend map layer.
**Response Schema:**
```json
{
  "zone_id": "AS-07",
  "lat": 14.8,
  "lng": 72.1,
  "score": 89,
  "tier": "critical",
  "agents": {
    "sst": {"confidence": 87, "reading": "+2.9°C"},
    "chl": {"confidence": 79, "reading": "-38%"},
    "wind": {"confidence": 71, "reading": "-22%"},
    "salinity": {"confidence": 65, "reading": "+0.4psu"}
  },
  "data_confidence": 0.92,
  "cloud_cover_days": 0
}