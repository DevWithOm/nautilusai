# NautilusAI: UI/UX Specification (uispec.md)
**Theme/Edition:** Living Ocean Explorer ("High-Tech Science Museum" Vibe)

## 1. Overview
The frontend is a beautifully designed, gamified climate dashboard. It feels organic, alive, and interactive, emphasizing ecological exploration over stressful monitoring.

## 2. Tech Stack & Environment
* **Framework:** React 18+ (Vite), TypeScript.
* **Styling:** Tailwind CSS (utilizing `backdrop-blur` for glassmorphism).
* **Animations:** Framer Motion (spring physics) & LottieFiles.
* **Mapping:** MapLibre GL JS (Globe projection enabled via MapLibre v3+) + Stadia Maps.
* **Data Visualization:** deck.gl (for fluid WebGL heatmaps and glowing polygons).
* **Audio:** HTML5 Audio API.
* **Environment Variables:**
  * `VITE_STADIA_API_KEY="your_stadia_api_key"`
  * `VITE_BACKEND_API_URL="http://localhost:8000/api/v1"`
  * `VITE_BACKEND_WS_URL="ws://localhost:8000/api/v1"`

## 3. TypeScript Interfaces (Core Data Models)
```typescript
interface Zone {
  zone_id: string;
  lat: number;
  lng: number;
  score: number;
  tier: 'critical' | 'advisory' | 'watch' | 'normal';
  agents: AgentVotes;
  data_confidence: number;
  cloud_cover_days: number;
}

interface AgentVotes {
  sst: AgentReading;
  chl: AgentReading;
  wind: AgentReading;
  salinity: AgentReading;
}

interface AgentReading {
  confidence: number;
  reading: string;
  status: 'thinking' | 'voting' | 'complete';
}