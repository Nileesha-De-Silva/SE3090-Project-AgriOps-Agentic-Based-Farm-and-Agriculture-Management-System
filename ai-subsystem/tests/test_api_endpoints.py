"""
Integration tests for Agent 2 FastAPI Endpoints.
Verifies agent service endpoints: /health, /tools, /analyze, /resume, /threads/{id}.
"""

import sys
import unittest
from pathlib import Path

# Ensure package import resolution
sys.path.append(str(Path(__file__).resolve().parent.parent))

from fastapi.testclient import TestClient
from main import app


class TestAgent2FastApiEndpoints(unittest.TestCase):

    def setUp(self):
        self.client = TestClient(app)

    def test_01_health_endpoint(self):
        """GET /health must return service status and model without calling LLM."""
        response = self.client.get("/health")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "online")
        self.assertIn("gemini", data["model"].lower())
        self.assertEqual(data["checkpointer"], "InMemorySaver")

    def test_02_tools_endpoint(self):
        """GET /tools must return advertised tool schemas."""
        response = self.client.get("/tools")
        self.assertEqual(response.status_code, 200)
        tools = response.json()
        self.assertGreaterEqual(len(tools), 2)
        tool_names = [t["name"] for t in tools]
        self.assertIn("lookup_crop_handbook", tool_names)
        self.assertIn("calculate_treatment_dosage", tool_names)

    def test_03_analyze_and_resume_cycle_over_http(self):
        """POST /analyze and POST /resume full human-in-the-loop HTTP cycle."""
        thread_id = "http-test-hitl-01"

        # 1. Start diagnosis with critical pest observation
        request_payload = {
            "field_id": "field-plot-42",
            "crop_variety": "Tomato",
            "growth_stage": "Fruiting",
            "observation": "caterpillars and worms eating holes through tomato fruits",
            "thread_id": thread_id,
        }
        res_ask = self.client.post("/analyze", json=request_payload)
        self.assertEqual(res_ask.status_code, 200)
        data_ask = res_ask.json()
        self.assertEqual(data_ask["status"], "awaiting_approval")
        self.assertIsNotNone(data_ask["interrupt"])
        self.assertEqual(data_ask["thread_id"], thread_id)
        self.assertIn("generate_diagnosis", data_ask["nodes"])

        # 2. Inspect thread in checkpointer before decision
        res_thread = self.client.get(f"/threads/{thread_id}")
        self.assertEqual(res_thread.status_code, 200)
        thread_data = res_thread.json()
        self.assertEqual(thread_data["thread_id"], thread_id)

        # 3. Manager sends approval decision
        resume_payload = {
            "thread_id": thread_id,
            "decision": "approve",
            "comments": "Immediate bio-control authorized.",
        }
        res_resume = self.client.post("/resume", json=resume_payload)
        self.assertEqual(res_resume.status_code, 200)
        data_resume = res_resume.json()
        self.assertEqual(data_resume["status"], "completed")
        self.assertIn("human_gate", data_resume["nodes"])
        self.assertIn("dispatch_task", data_resume["nodes"])
        self.assertIn("APPROVED", data_resume["answer"])


if __name__ == "__main__":
    unittest.main()
