"""Manual live Gemini smoke test: synthetic evidence, no backend or database.

Run from this directory: python test_gemini.py
This is not a pytest test and never runs a provider call during test collection.
"""
import json
import os
import sys
from decimal import Decimal, ROUND_HALF_UP
from uuid import uuid4

from dotenv import load_dotenv

from app.config import ROOT, Settings
from app.nodes import InventoryNodes
from app.state import ContextEvidence


def sample_evidence():
    return ContextEvidence.model_validate({
        "item": {"id": "00000000-0000-4000-8000-000000000001",
                 "name": "Sample Organic Fertilizer", "currentStock": "5",
                 "minimumStockLevel": "20", "unitOfMeasurement": "kg"},
        "incomingQuantity": "10", "pendingRecommendationId": None,
        "usageLast30Days": "30", "offersTruncated": False,
        "offers": [
            {"supplierId": "00000000-0000-4000-8000-000000000002",
             "supplierName": "Sample Budget Supplier", "unitPrice": "120",
             "leadTimeDays": 7},
            {"supplierId": "00000000-0000-4000-8000-000000000003",
             "supplierName": "Sample Express Supplier", "unitPrice": "150",
             "leadTimeDays": 2},
        ],
    }).model_dump(mode="json")


def run_demo(settings, model=None):
    """Reuse production selection/validation without constructing a backend client."""
    if not settings.gemini_api_key or not settings.chat_model:
        raise ValueError("Set GEMINI_API_KEY and CHAT_MODEL in the agent's .env first.")
    context = sample_evidence()
    state = {"run_id": str(uuid4()), "inventory_item_id": context["item"]["id"],
             "target_stock": "50", "context": context, "trace": [],
             "model_attempts": 0, "total_tokens": 0}
    nodes = InventoryNodes(settings, backend=None, model=model)
    state.update(nodes.calculate_need(state))
    while state["status"] in {"model_needed", "retry_model"}:
        state.update(nodes.choose_supplier(state))
        state.update(nodes.validate_proposal(state))

    result = {"mode": "sample_data_only", "model": settings.chat_model,
              "status": "validated_sample" if state["status"] == "ready_to_submit" else state["status"],
              "savedToBackend": False, "evidence": context,
              "targetStock": state["target_stock"], "quantity": state["quantity"],
              "modelAttempts": state["model_attempts"], "totalTokens": state["total_tokens"],
              "error": state.get("error"), "trace": state["trace"]}
    if state["status"] == "ready_to_submit":
        choice = state["candidate"]
        offer = next(o for o in context["offers"] if o["supplierId"] == choice["supplier_id"])
        result["selection"] = {
            **offer, "reason": choice["reason"], "leadTimeSource": "configured estimate",
            "estimatedCost": str((Decimal(offer["unitPrice"]) * Decimal(state["quantity"]))
                                 .quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)),
        }
    return result


def main():
    load_dotenv(ROOT / ".env")
    try:
        # Backend configuration is deliberately irrelevant to this standalone test.
        settings = Settings(gemini_api_key=os.getenv("GEMINI_API_KEY", "").strip(),
                            chat_model=os.getenv("CHAT_MODEL", "").strip())
        if not settings.gemini_api_key or not settings.chat_model:
            raise ValueError("Set GEMINI_API_KEY and CHAT_MODEL in the agent's .env first.")
        print("Calling Gemini with sample data (up to 2 attempts). No backend writes.", file=sys.stderr)
        result = run_demo(settings)
    except ValueError as exc:
        print(str(exc), file=sys.stderr)
        return 2
    print(json.dumps(result, indent=2, ensure_ascii=False))
    if result["status"] != "validated_sample":
        if result.get("error") == "model_provider_unavailable":
            print("Gemini returned a server-side error (5xx). Wait a minute and retry. "
                  "If it persists, try another text model available to your project by changing "
                  "CHAT_MODEL in .env. This does not require a backend token.", file=sys.stderr)
            return 1
        print("Selection failed. Check key, model access, quota and connectivity. "
              "Raw provider errors are omitted to avoid exposing credentials.", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
