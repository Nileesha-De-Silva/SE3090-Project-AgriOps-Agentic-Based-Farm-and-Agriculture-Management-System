FROM python:3.12-slim

WORKDIR /app

# Install dependencies with increased network timeout and retries
COPY requirements.txt .
RUN pip install --default-timeout=1000 --retries 10 -r requirements.txt

# Copy agent application code
COPY . .

# Expose port 8001 for Agent 1 (Farm Planning Agent)
EXPOSE 8001

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8001"]
