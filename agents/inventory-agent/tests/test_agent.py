"""Offline tests: actual FastAPI/LangGraph/SQLite, controlled backend and model doubles."""
from copy import deepcopy
from types import SimpleNamespace
from uuid import uuid4

import httpx
import pytest
from fastapi.testclient import TestClient

from app.backend_client import BackendClient, BackendError
from app.config import Settings
from app.main import create_app
from app.state import SupplierChoice

ITEM, SUPPLIER = str(uuid4()), str(uuid4())


class FakeBackend:
    def __init__(self):
        self.evidence = {"item": {"id": ITEM, "name": "Fertilizer", "currentStock": 5,
            "minimumStockLevel": 20, "unitOfMeasurement": "kg"}, "incomingQuantity": 0,
            "pendingRecommendationId": None, "usageLast30Days": 10, "offersTruncated": False,
            "offers": [{"supplierId": SUPPLIER, "supplierName": "Supplier", "unitPrice": 12.5, "leadTimeDays": 2}]}
        self.records, self.payloads = {}, []
        self.lose_response = False
        self.read_error = False

    def close(self):
        pass

    def manager_owner(self, token):
        if token not in {"manager-a", "manager-b"}:
            raise BackendError("backend_forbidden", 403)
        return token

    def context(self, item):
        if self.read_error:
            raise BackendError("backend_unreachable")
        return deepcopy(self.evidence)

    def submit(self, payload):
        self.payloads.append(deepcopy(payload))
        run_id = payload["agentRunId"]
        result = self.records.setdefault(run_id, {"id": str(uuid4()), "agentRunId": run_id,
            "inventoryItemId": ITEM, "supplierId": payload["supplierId"], "status": "Pending", "purchaseRequestId": None})
        if self.lose_response:
            self.lose_response = False
            raise BackendError("backend_unreachable")
        return deepcopy(result)

    def recommendation(self, recommendation_id):
        return deepcopy(next(r for r in self.records.values() if r["id"] == recommendation_id))


class FakeModel:
    def __init__(self, choices=None):
        self.calls = 0
        self.choices = choices or [SUPPLIER]

    def invoke(self, messages):
        self.calls += 1
        choice = self.choices[min(self.calls - 1, len(self.choices) - 1)]
        if choice == "raise":
            raise RuntimeError("provider error containing PRIVATE SECRET")
        return {"parsed": SupplierChoice(supplier_id=choice, reason="Observed price and lead time support this offer."),
                "raw": SimpleNamespace(usage_metadata={"total_tokens": 17}), "parsing_error": None}


@pytest.fixture
def rig(tmp_path):
    settings = Settings(checkpoint_db=str(tmp_path / "checkpoints.sqlite"), backend_agent_token="test-agent",
                        gemini_api_key="test-key", chat_model="test-model")
    return settings, FakeBackend(), FakeModel()


def body():
    return {"request_id": str(uuid4()), "inventory_item_id": ITEM, "target_stock": "20"}


def headers(owner="manager-a"):
    return {"Authorization": f"Bearer {owner}"}


def test_persist_pause_restart_and_observe_approval(rig):
    settings, backend, model = rig
    request = body()
    with TestClient(create_app(settings, backend, model)) as client:
        result = client.post("/recommend", json=request, headers=headers())
        assert result.status_code == 200, result.text
        data = result.json()
        assert data["status"] == "awaiting_approval"
        assert data["quantity"] == "15"
        assert data["totalTokens"] == 17
        assert backend.payloads[0]["recommendedQuantity"] == "15"
        assert backend.payloads[0]["observation"]["unitPrice"] == "12.5"
        assert data["recommendation"]["purchaseRequestId"] is None
        assert client.post("/recommend", json={**request, "target_stock": "20.00"}, headers=headers()).status_code == 200
        assert model.calls == 1 and len(backend.payloads) == 1
        assert client.post(f"/runs/{request['request_id']}/resume", json={"approved": True}, headers=headers()).status_code == 409
    # New app and SQLite saver; no model rerun and no duplicate proposal.
    record = backend.records[request["request_id"]]
    record.update(status="Approved", purchaseRequestId=str(uuid4()))
    with TestClient(create_app(settings, backend, model)) as client:
        assert client.get(f"/runs/{request['request_id']}", headers=headers()).json()["status"] == "awaiting_approval"
        result = client.post(f"/runs/{request['request_id']}/resume", headers=headers())
        assert result.status_code == 200, result.text
        assert result.json()["status"] == "approved"
        assert result.json()["recommendation"]["purchaseRequestId"] == record["purchaseRequestId"]
        assert client.post(f"/runs/{request['request_id']}/resume", headers=headers()).json()["status"] == "approved"
        assert model.calls == 1 and len(backend.payloads) == 1


def test_rejected_decision(rig):
    settings, backend, model = rig
    request = body()
    with TestClient(create_app(settings, backend, model)) as client:
        client.post("/recommend", json=request, headers=headers())
        backend.records[request["request_id"]]["status"] = "Rejected"
        result = client.post(f"/runs/{request['request_id']}/resume", headers=headers())
        assert result.json()["status"] == "rejected"
        assert result.json()["recommendation"]["purchaseRequestId"] is None


@pytest.mark.parametrize("change,status", [
    ("healthy", "no_action"), ("incoming", "no_action"), ("no_supplier", "blocked"),
    ("pending", "blocked"), ("truncated", "blocked"), ("bad_evidence", "blocked"),
])
def test_guardrails_without_model_calls(rig, change, status):
    settings, backend, model = rig
    if change == "healthy": backend.evidence["item"]["currentStock"] = 20
    if change == "incoming": backend.evidence["incomingQuantity"] = 15
    if change == "no_supplier": backend.evidence["offers"] = []
    if change == "pending": backend.evidence["pendingRecommendationId"] = str(uuid4())
    if change == "truncated": backend.evidence["offersTruncated"] = True
    if change == "bad_evidence": backend.evidence["item"]["currentStock"] = -5
    with TestClient(create_app(settings, backend, model)) as client:
        result = client.post("/recommend", json=body(), headers=headers())
        assert result.status_code == 200, result.text
        assert result.json()["status"] == status
        assert model.calls == 0 and not backend.payloads


def test_net_incoming_quantity(rig):
    settings, backend, model = rig
    backend.evidence["incomingQuantity"] = 6
    with TestClient(create_app(settings, backend, model)) as client:
        assert client.post("/recommend", json=body(), headers=headers()).json()["quantity"] == "9"
        assert backend.payloads[0]["recommendedQuantity"] == "9"


def test_self_correction_is_bounded(rig):
    settings, backend, _ = rig
    model = FakeModel([str(uuid4()), SUPPLIER])
    with TestClient(create_app(settings, backend, model)) as client:
        result = client.post("/recommend", json=body(), headers=headers())
        assert result.json()["status"] == "awaiting_approval"
        assert model.calls == 2 and len(backend.payloads) == 1


@pytest.mark.parametrize("choice", ["unknown", "raise"])
def test_bad_output_or_provider_failure_never_submits(rig, choice):
    settings, backend, _ = rig
    model = FakeModel([str(uuid4()) if choice == "unknown" else "raise"])
    with TestClient(create_app(settings, backend, model)) as client:
        result = client.post("/recommend", json=body(), headers=headers())
        assert result.json()["status"] == "failed"
        assert model.calls == 2 and not backend.payloads
        assert "PRIVATE SECRET" not in result.text


def test_lost_submit_response_retries_exact_payload(rig):
    settings, backend, model = rig
    backend.lose_response = True
    request = body()
    with TestClient(create_app(settings, backend, model)) as client:
        result = client.post("/recommend", json=request, headers=headers())
        assert result.status_code == 502
        result = client.post(f"/runs/{request['request_id']}/resume", headers=headers())
        assert result.status_code == 200, result.text
        assert result.json()["status"] == "awaiting_approval"
        assert len(backend.records) == 1 and model.calls == 1
        assert backend.payloads[0] == backend.payloads[1]


def test_owner_isolation_and_changed_input(rig):
    settings, backend, model = rig
    request = body()
    with TestClient(create_app(settings, backend, model)) as client:
        assert client.post("/recommend", json=request).status_code == 401
        assert client.post("/recommend", json=request, headers=headers("worker")).status_code == 403
        assert client.post("/recommend", json=request, headers=headers()).status_code == 200
        assert client.get(f"/runs/{request['request_id']}", headers=headers("manager-b")).status_code == 404
        assert client.post(f"/runs/{request['request_id']}/resume", headers=headers("manager-b")).status_code == 404
        assert client.post("/recommend", json={**request, "target_stock": 30}, headers=headers()).status_code == 409


def test_input_limits_and_no_model_configuration(tmp_path):
    backend = FakeBackend()
    with TestClient(create_app(Settings(checkpoint_db=str(tmp_path / "empty.sqlite")), backend, FakeModel())) as client:
        assert client.get("/health").json()["configured"] is False
        assert client.post("/recommend", json=body(), headers=headers()).status_code == 503
        assert client.post("/recommend", json={**body(), "target_stock": "1.234"}, headers=headers()).status_code == 422
        assert client.post("/recommend", json={**body(), "approved": True}, headers=headers()).status_code == 422


def test_backend_client_uses_separate_tokens_and_only_fixed_routes():
    seen = []
    def handler(request):
        seen.append((request.url.path, request.headers["Authorization"]))
        return httpx.Response(200, json={"subject": "a", "issuer": "trusted"})
    backend = BackendClient(Settings(backend_agent_token="AGENT"))
    backend.http.close()
    backend.http = httpx.Client(base_url="https://backend.test/api/", transport=httpx.MockTransport(handler))
    backend.manager_owner("MANAGER")
    backend.context(ITEM)
    assert seen == [("/api/inventory-agent/access", "Bearer MANAGER"),
                    (f"/api/inventory-agent/items/{ITEM}/context", "Bearer AGENT")]
    assert not hasattr(backend, "approve") and not hasattr(backend, "purchase")
    backend.close()
