FROM python:3.12-slim

WORKDIR /app

# Install dependencies with increased network timeout and retries
COPY requirements.txt .
RUN pip install --default-timeout=1000 --retries 10 -r requirements.txt

# Copy source code
COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
