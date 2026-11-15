# TerraPredict-AI Deployment Guide

This guide explains how to deploy TerraPredict-AI to production.

---

## Architecture Overview

TerraPredict-AI consists of 3 integrated services:
1. **Frontend**: Vite + React 19 + MapLibre GL JS + Three.js
2. **Gateway**: Node.js Express (`backend/routing.js`) with NASA POWER API queries, geocoding & image enrichment
3. **ML Engine**: Python FastAPI (`ml/src/api.py`) with FAO EcoCrop biophysical scoring model & 3-year succession beam search optimizer

---

## Option 1: Deploy Frontend on Vercel + Backend on Render / Railway (Recommended)

### Step 1: Deploy Backend & ML Engine (e.g. Render or Railway)

Because the Python ML engine uses FastAPI, Uvicorn, and scientific packages (`scipy`, `pandas`, `lightgbm`), run the backend container on **Render**, **Railway**, **Fly.io**, or any VPS:

#### Via Railway:
1. Go to [railway.app](https://railway.app) and create a new project from your GitHub repo.
2. Railway will automatically detect the root `Dockerfile`.
3. Set the public domain in Railway (e.g., `https://terrapredict-api.up.railway.app`).

#### Via Render:
1. Go to [render.com](https://render.com) and click **New Web Service**.
2. Select your repository.
3. Choose **Docker** as the environment.
4. Render builds the Dockerfile and assigns a URL: `https://terrapredict-api.onrender.com`.

---

### Step 2: Deploy Frontend to Vercel

1. Push your code to GitHub:
   ```bash
   git push origin feat/e2e-integration
   ```
2. Log in to [vercel.com](https://vercel.com) and click **"Add New Project"**.
3. Import your GitHub repository (`TerraPredict-AI`).
4. In the **Project Configuration** screen:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend` (or leave as `./` with root `vercel.json`)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. In `frontend/vercel.json` (or Vercel dashboard environment variables):
   Update the backend rewrite to point to your deployed backend URL:
   ```json
   {
     "rewrites": [
       {
         "source": "/api/(.*)",
         "destination": "https://terrapredict-api.up.railway.app/api/$1"
       },
       {
         "source": "/(.*)",
         "destination": "/index.html"
       }
     ]
   }
   ```
6. Click **Deploy**. Vercel will build and assign your live domain (e.g., `https://terrapredict-ai.vercel.app`).

---

## Option 2: Deploy All-in-One via Docker (1 Single URL)

The included `Dockerfile` packages the entire stack (React static build + Node Express gateway + Python FastAPI ML service) into a single container running on port 3001.

### Local or VPS Run:
```bash
# Build container
docker compose build

# Run in background
docker compose up -d
```
Visit `http://localhost:3001` or your server's IP address.

---

## Environment Variables

| Variable | Description | Default |
| :--- | :--- | :--- |
| `PORT` | Express Gateway HTTP Port | `3001` |
| `ML_URL` | Endpoint to Python FastAPI scoring service | `http://127.0.0.1:8001/predict` |
| `NASA_POWER_URL` | NASA POWER Point API endpoint | `https://power.larc.nasa.gov/api/temporal/daily/point` |
