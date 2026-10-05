"""Offline checks of the manual demo; no Gemini credentials or calls."""
from types import SimpleNamespace

import pytest

from app.config import Settings
from app.nodes import InventoryNodes, model_error_code
from app.state import SupplierChoice
from test_gemini import run_demo, sample_evidence


class Model:
    def __init__(self, supplier_id):
        self.supplier_id = supplier_id
        self.calls = 0

    def invoke(self, messages):
        self.calls += 1
        return {"parsed": SupplierChoice(supplier_id=self.supplier_id,
                    reason="The estimated delivery time is shorter at a higher price."),
                "raw": SimpleNamespace(usage_metadata={"total_tokens": 12}),
                "parsing_error": None}


def test_demo_without_backend_token_never_submits(monkeypatch):
    def forbidden(*args):
        pytest.fail("Standalone demo must never access backend nodes")
    for method in ("read_inventory", "submit_proposal", "request_approval", "observe_decision"):
        monkeypatch.setattr(InventoryNodes, method, forbidden)
    model = Model(sample_evidence()["offers"][1]["supplierId"])
    result = run_demo(Settings(gemini_api_key="fake", chat_model="fake"), model)
    assert result["status"] == "validated_sample"
    assert result["savedToBackend"] is False
    assert result["quantity"] == "35"
    assert result["selection"]["estimatedCost"] == "5250.00"
    assert result["selection"]["leadTimeSource"] == "configured estimate"
    assert model.calls == 1


def test_demo_rejects_invented_supplier_with_bounded_calls():
    model = Model("00000000-0000-4000-8000-000000000099")
    result = run_demo(Settings(gemini_api_key="fake", chat_model="fake"), model)
    assert result["status"] == "failed"
    assert "selection" not in result
    assert model.calls == 2


def test_demo_requires_gemini_configuration_before_model_call():
    model = Model(sample_evidence()["offers"][0]["supplierId"])
    with pytest.raises(ValueError, match="GEMINI_API_KEY and CHAT_MODEL"):
        run_demo(Settings(), model)
    assert model.calls == 0


@pytest.mark.parametrize("status,expected", [
    (400, "model_bad_request"), (403, "model_auth_or_permission_denied"),
    (404, "model_not_found_or_unavailable"), (429, "model_quota_or_rate_limit"),
    (500, "model_provider_unavailable"), (503, "model_provider_unavailable"),
])
def test_wrapped_provider_error_is_classified_without_raw_text(status, expected):
    cause = RuntimeError("PRIVATE KEY must not appear")
    cause.code = status
    wrapper = RuntimeError("PRIVATE KEY in wrapper")
    wrapper.__cause__ = cause
    assert model_error_code(wrapper) == expected


def test_provider_error_survives_validation_and_trace():
    class UnavailableModel:
        def invoke(self, messages):
            cause = RuntimeError("PRIVATE KEY")
            cause.code = 503
            raise RuntimeError("wrapped PRIVATE KEY") from cause
    result = run_demo(Settings(gemini_api_key="fake", chat_model="fake"), UnavailableModel())
    assert result["error"] == "model_provider_unavailable"
    assert result["modelAttempts"] == 2
    assert "PRIVATE KEY" not in str(result)
    assert result["trace"][-1]["error"] == "model_provider_unavailable"


def test_schema_failure_is_distinct_from_provider_failure():
    class MalformedModel:
        def invoke(self, messages):
            return {"parsed": None, "parsing_error": ValueError("PRIVATE output"), "raw": None}
    result = run_demo(Settings(gemini_api_key="fake", chat_model="fake"), MalformedModel())
    assert result["error"] == "model_response_schema_invalid"
    assert "PRIVATE output" not in str(result)
