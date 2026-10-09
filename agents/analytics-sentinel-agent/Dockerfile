# ==============================================================================
# Dockerfile for AgriOps Agent 4: Validation & Safety Agent (Sahas - Component 4)
# Multi-agent deterministic safety firewall, weather gating, and HITL approvals
# ==============================================================================

FROM python:3.12-slim

WORKDIR /app

# Install curl for Docker container health check
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy Agent 4 source code and assets
COPY . .

# Expose dedicated Agent 4 port
EXPOSE 8004

# Container Healthcheck targeting Agent 4 /health endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:8004/health || exit 1

# Start FastAPI server on port 8004
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8004"]
