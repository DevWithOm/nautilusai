# NautilusAI Deployment Guide

NautilusAI is a full-stack platform. For the best experience, we recommend deploying the **Backend to Render** and the **Frontend to Vercel**.

## 1. Backend (FastAPI) on [Render.com](https://render.com)

1. **Create a New Web Service**: Connect your GitHub repository.
2. **Root Directory**: Set to `backend`.
3. **Runtime**: Select `Python`.
4. **Build Command**: `pip install -r requirements.txt`
5. **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
6. **Environment Variables**:
   - `GEMINI_API_KEY`: Your Google API Key.
   - `FRONTEND_URL`: Your Vercel URL (e.g., `https://nautilusai.vercel.app`).
   - `PYTHON_VERSION`: `3.10.0` or higher.

---

## 2. Frontend (Vite) on [Vercel](https://vercel.com)

1. **New Project**: Import your repository.
2. **Root Directory**: Set to `frontend`.
3. **Framework Preset**: `Vite`.
4. **Build Command**: `npm run build`
5. **Output Directory**: `dist`
6. **Environment Variables**:
   - `VITE_API_URL`: Your Render Web Service URL (e.g., `https://nautilusai-api.onrender.com`).
   - `VITE_WS_URL`: Your Render URL with `wss://` (e.g., `wss://nautilusai-api.onrender.com`).

---

## 3. Pre-Flight Checklist

1. [ ] **Backend First**: Deploy the backend first to get its URL.
2. [ ] **HTTPS/WSS**: Ensure you use `wss://` for the WebSocket URL in production.
3. [ ] **CORS**: Verify `FRONTEND_URL` exactly matches your Vercel address.

---

© 2026 NautilusAI — Autonomous Ocean Intelligence
