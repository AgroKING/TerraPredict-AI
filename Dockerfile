# ==========================================
# Multi-stage Dockerfile for TerraPredict-AI
# ==========================================

# Stage 1: Build the React Vite frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Stage 2: Runtime environment with Node.js + Python
FROM python:3.11-slim
WORKDIR /app

# Install system dependencies & Node.js
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    build-essential \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y --no-install-recommends nodejs \
    && rm -rf /var/lib/apt/lists/*

# Install Python ML dependencies
COPY ml/requirements.txt ./ml/
RUN pip install --no-cache-dir -r ml/requirements.txt

# Install Node backend dependencies
COPY backend/package*.json ./backend/
RUN cd backend && npm ci --omit=dev

# Copy application code
COPY backend/ ./backend/
COPY ml/ ./ml/
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Environment variables
ENV PORT=3001
ENV ML_URL=http://127.0.0.1:8001/predict
ENV PYTHONPATH=/app/ml/src

EXPOSE 3001

# Start ML FastAPI daemon on 8001 and Express Gateway on $PORT
CMD ["sh", "-c", "python -m uvicorn api:app --app-dir ml/src --port 8001 --host 127.0.0.1 & node backend/routing.js"]
