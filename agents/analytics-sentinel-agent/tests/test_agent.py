"""Comprehensive test suite for Agent 4: Production Analytics & Operations Sentinel Agent."""

import pytest
from uuid import uuid4
from fastapi.testclient import TestClient
from langgraph.checkpoint.memory import MemorySaver

from app.config import Settings
from app.backend_client import BackendClient
from app.graph import build_graph
from app.main import create_app
from app import tools


class MockBackend(BackendClient):
    def __init__(self, harvest_records=None, audit_records=None):
        self._harvests = harvest_records or []
        self._audits = audit_records or []
        self.created_tasks = []

    def fetch_harvest_yields(self, token=None):
        return self._harvests

    def fetch_audit_logs(self, token=None, take=50):
        return self._audits

    def create_farm_task(self, task_payload, token=None):
        self.created_tasks.append(task_payload)
        return {"id": str(uuid4()), **task_payload, "status": "Pending"}

    def close(self):
        pass


def test_yield_metrics_calculation_normal_and_deficit():
    # Baseline: 1000 kg, 1200 kg -> mean 1100 kg. Latest: 600 kg (-45.4% deficit)
    harvests = [
        {"fieldId": "field-1", "cropName": "Wheat", "totalYieldAmount": 1000.0},
        {"fieldId": "field-1", "cropName": "Wheat", "totalYieldAmount": 1200.0},
        {"fieldId": "field-1", "cropName": "Wheat", "totalYieldAmount": 600.0},
    ]

    score, variance, anomalies = tools.calculate_yield_metrics(harvests, field_id="field-1", crop_name="Wheat", sensitivity_threshold=0.20)

    assert variance < -40.0
    assert score < 60.0
    assert len(anomalies) == 1
    assert anomalies[0]["anomaly_type"] == "YIELD_DEFICIT"
    assert anomalies[0]["severity"] == "CRITICAL"


def test_audit_anomaly_detection_privilege_spike():
    audits = [
        {"actionType": "RoleAssignment", "timestamp": "2026-10-06T00:00:00Z"},
        {"actionType": "RoleAssignment", "timestamp": "2026-10-06T00:01:00Z"},
        {"actionType": "UserRoleUpdated", "timestamp": "2026-10-06T00:02:00Z"},
        {"actionType": "RoleAssignment", "timestamp": "2026-10-06T00:03:00Z"},
        {"actionType": "UserRoleUpdated", "timestamp": "2026-10-06T00:04:00Z"},
        {"actionType": "RoleAssignment", "timestamp": "2026-10-06T00:05:00Z"},
    ]

    anomalies = tools.detect_audit_anomalies(audits)
    assert len(anomalies) == 1
    assert anomalies[0]["anomaly_type"] == "PRIVILEGE_MODIFICATION_SPIKE"
    assert anomalies[0]["severity"] == "HIGH"


def test_operational_risk_evaluation():
    critical_anomaly = [{"severity": "CRITICAL"}]
    high_anomaly = [{"severity": "HIGH"}]
    empty = []

    assert tools.evaluate_operational_risk(critical_anomaly, empty) == "CRITICAL"
    assert tools.evaluate_operational_risk(empty, high_anomaly) == "HIGH"
    assert tools.evaluate_operational_risk(empty, empty) == "LOW"


def test_remediation_plan_creation():
    yield_anomalies = [{
        "anomaly_type": "YIELD_DEFICIT",
        "severity": "CRITICAL",
        "variance_percent": -45.0,
    }]
    plan = tools.formulate_remediation_plan("CRITICAL", yield_anomalies, [], target_field_id="field-123")
    assert plan is not None
    assert plan["proposed_task_type"] == "SoilInspection"
    assert plan["priority"] == "Critical"
    assert plan["target_field_id"] == "field-123"


def test_full_graph_execution_low_risk_auto_completes():
    harvests = [
        {"fieldId": "field-1", "cropName": "Corn", "totalYieldAmount": 1000.0},
        {"fieldId": "field-1", "cropName": "Corn", "totalYieldAmount": 1050.0},
    ]
    mock_backend = MockBackend(harvest_records=harvests, audit_records=[])
    settings = Settings(checkpoint_db=":memory:")
    checkpointer = MemorySaver()
    graph = build_graph(settings, mock_backend, checkpointer)

    run_id = str(uuid4())
    cfg = {"configurable": {"thread_id": f"sentinel:{run_id}"}}
    initial_state = {
        "run_id": run_id,
        "field_id": "field-1",
        "crop_name": "Corn",
        "sensitivity_threshold": 0.20,
        "audit_lookback_count": 50,
        "harvest_records": [],
        "audit_records": [],
        "anomalies": [],
        "trace": [],
    }

    graph.invoke(initial_state, cfg)
    state = graph.get_state(cfg)

    assert state.values["overall_risk_level"] == "LOW"
    assert state.values["requires_human_approval"] is False
    assert len(state.values["trace"]) >= 3


def test_full_graph_execution_human_approval_pause_and_resume():
    # Severe yield deficit -> triggers HIGH/CRITICAL risk and requires human approval
    harvests = [
        {"fieldId": "field-2", "cropName": "Soybean", "totalYieldAmount": 2000.0},
        {"fieldId": "field-2", "cropName": "Soybean", "totalYieldAmount": 2200.0},
        {"fieldId": "field-2", "cropName": "Soybean", "totalYieldAmount": 900.0},
    ]
    mock_backend = MockBackend(harvest_records=harvests, audit_records=[])
    settings = Settings(checkpoint_db=":memory:")
    checkpointer = MemorySaver()
    graph = build_graph(settings, mock_backend, checkpointer)

    run_id = str(uuid4())
    cfg = {"configurable": {"thread_id": f"sentinel:{run_id}"}}
    initial_state = {
        "run_id": run_id,
        "field_id": "field-2",
        "crop_name": "Soybean",
        "sensitivity_threshold": 0.20,
        "audit_lookback_count": 50,
        "harvest_records": [],
        "audit_records": [],
        "anomalies": [],
        "trace": [],
    }

    # First invocation: pauses at human approval gate
    graph.invoke(initial_state, cfg)
    paused_state = graph.get_state(cfg)

    assert paused_state.values["requires_human_approval"] is True
    assert paused_state.values["approval_status"] == "pending_approval"
    assert any(task.interrupts for task in paused_state.tasks)

    # Resume with approval
    from langgraph.types import Command
    graph.invoke(Command(resume={"action": "approve", "manager_notes": "Authorize emergency soil test"}), cfg)

    resumed_state = graph.get_state(cfg)
    assert resumed_state.values["approval_status"] == "approved"
    assert "Remediation approved by manager" in resumed_state.values["final_outcome"]
    assert len(mock_backend.created_tasks) == 1
    assert mock_backend.created_tasks[0]["fieldId"] == "field-2"


def test_api_endpoints_via_testclient():
    harvests = [
        {"fieldId": "field-3", "cropName": "Barley", "totalYieldAmount": 500.0},
    ]
    mock_backend = MockBackend(harvest_records=harvests, audit_records=[])
    settings = Settings(checkpoint_db=":memory:")
    test_app = create_app(settings=settings, backend=mock_backend)

    with TestClient(test_app) as client:
        # Health
        res = client.get("/health")
        assert res.status_code == 200
        assert res.json()["service"] == "analytics-sentinel-agent"

        # Analyze
        analyze_res = client.post("/sentinel/analyze", json={"crop_name": "Barley", "sensitivity_threshold": 0.20})
        assert analyze_res.status_code == 200
        data = analyze_res.json()
        assert "run_id" in data
        run_id = data["run_id"]

        # Get run
        get_res = client.get(f"/runs/{run_id}")
        assert get_res.status_code == 200
        assert get_res.json()["run_id"] == run_id
