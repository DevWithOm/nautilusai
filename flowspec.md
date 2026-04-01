# NautilusAI: User Journey & Event Flow (flowspec.md)

## 1. The Initialization Sequence
1. **App loads** → Display the dark teal background with CSS wave skeleton loader.
2. **Map Mounts** → The Stadia/MapLibre 3D globe renders and rotates autonomously for 2 seconds.
3. **Camera Swoop** → The map camera dynamically swoops down from space into the Arabian Sea bounding box.
4. **WebSocket Connects** → UI displays "Initializing agent swarm..." while connecting to `VITE_BACKEND_WS_URL`.

## 2. The Active Monitoring Loop
5. **Agents Awaken** → The 4 Lottie agents appear on the bottom left. They enter the "idle" (floating) state.
6. **Data Render** → The backend sends the 47 zones via GET request. deck.gl renders the liquid, breathing polygons on the map.
7. **The Swarm Debates** → Anomaly detected in AS-07. The WebSocket streams the debate. The active agent's Lottie avatar morphs and glows, syncing with the live terminal text.

## 3. The Resolution & Gamification
8. **Coordinator Fires** → The Gemini 1.5 Pro Mission Debrief is generated.
9. **UI Reaction** → The right-side Action Center panel glides in (Framer Motion spring physics). The acoustic sonar chime plays (since the user has already interacted with the page).
10. **User Feedback** → The user clicks ✅ `[VALIDATE THREAT]`.
11. **Dopamine Hit** → The button depresses, confetti bursts, and a toast notification appears: *"Wind Agent accuracy improved by +0.5%! 🚀"* (Data is sent to ChromaDB via POST request).