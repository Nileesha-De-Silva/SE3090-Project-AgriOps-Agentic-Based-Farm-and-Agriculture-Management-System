import sys
import os
import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"
    assert "Farm Planning Agent" in data["agent"]

def test_generate_farm_plan_success():
    payload = {
        "field_id": "field-101",
        "crop_season_id": "season-2026-spring"
    }
    response = client.post("/plan", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "threadId" in data
    assert "recommendedSchedule" in data
    schedule = data["recommendedSchedule"]
    assert schedule["fieldId"] == "field-101"
    assert len(schedule["tasks"]) >= 5
    assert data["approvalRequired"] is True
    assert len(data["trace"]) > 0

def test_generate_farm_plan_invalid_body():
    response = client.post("/plan", json={"bad_key": "bad_value"})
    assert response.status_code == 422
