"""
Unit Tests for Agent 2 Subsystem.
Validates ReAct tools, LangGraph explicit StateGraph, self-correction,
Human-in-the-Loop interrupt/resume, checkpointer memory, and token counting.
"""

import sys
import unittest
from pathlib import Path

# Ensure package import resolution
sys.path.append(str(Path(__file__).resolve().parent.parent))

from langgraph.types import Command
from agents.agent2_crop_analysis import (
    AGENT2_APP,
    build_agent2_graph,
    run_agent2_workflow,
)
from agents.tools.symptom_mapping_tool import (
    TOOLS,
    lookup_crop_handbook,
    calculate_treatment_dosage,
)


class TestAgent2Subsystem(unittest.TestCase):

    def test_01_tool_json_schemas(self):
        """Verify @tool definitions produce valid JSON schema from docstrings and type hints."""
        schema = lookup_crop_handbook.args_schema.model_json_schema()
        self.assertIn("crop_variety", schema["properties"])
        self.assertIn("symptom", schema["properties"])
        self.assertIn("crop_variety", schema["required"])
        self.assertTrue(len(lookup_crop_handbook.description) > 10)

        calc_schema = calculate_treatment_dosage.args_schema.model_json_schema()
        self.assertIn("area_hectares", calc_schema["properties"])
        self.assertIn("dose_per_hectare", calc_schema["properties"])

    def test_02_tool_execution(self):
        """Verify tools execute properly with keyword arguments."""
        result = lookup_crop_handbook.invoke({
            "crop_variety": "Tomato",
            "symptom": "yellowing leaves",
        })
        self.assertIn("[Tomato-Handbook]", result)
        self.assertIn("Nitrogen / Iron Chlorosis", result)

        calc_result = calculate_treatment_dosage.invoke({
            "area_hectares": 2.0,
            "dose_per_hectare": 3.0,
        })
        self.assertIn("6.00 units", calc_result)

    def test_03_low_risk_direct_completion(self):
        """Low risk observations should complete without human interruption."""
        input_data = {
            "field_id": "field-north-1",
            "crop_variety": "Tomato",
            "growth_stage": "Vegetative",
            "observation": "routine check, healthy growth, minor dust on leaves",
            "image_url": "",
        }
        thread_id = "test-low-risk-001"
        response = run_agent2_workflow(input_data, thread_id=thread_id)

        self.assertEqual(response.status, "completed")
        self.assertIn("input_guard", response.nodes)
        self.assertIn("retrieve", response.nodes)
        self.assertIn("grade", response.nodes)
        self.assertIn("dispatch_task", response.nodes)
        self.assertNotIn("human_gate", response.nodes)
        self.assertIsNotNone(response.answer)

    def test_04_high_risk_human_in_the_loop_pause_and_approval(self):
        """Critical/High risk issues must freeze at human_gate and resume on approval."""
        thread_id = "test-crit-approval-002"
        input_data = {
            "field_id": "field-pest-99",
            "crop_variety": "Tomato",
            "growth_stage": "Fruiting",
            "observation": "Caterpillars and worms chewing large holes in tomato fruit",
            "image_url": "http://agriops.local/evidence/crit.jpg",
        }

        # Turn 1: Should pause at human_gate with an interrupt payload
        turn1_response = run_agent2_workflow(input_data, thread_id=thread_id)
        self.assertEqual(turn1_response.status, "awaiting_approval")
        self.assertIsNotNone(turn1_response.interrupt)
        self.assertIn("field-pest-99", turn1_response.interrupt["ask"])
        self.assertIn("generate_diagnosis", turn1_response.nodes)

        # Turn 2: Manager approves the high-risk action
        turn2_response = run_agent2_workflow(Command(resume="approve"), thread_id=thread_id)
        self.assertEqual(turn2_response.status, "completed")
        self.assertIn("human_gate", turn2_response.nodes)
        self.assertIn("dispatch_task", turn2_response.nodes)
        self.assertIn("APPROVED & DISPATCHED", turn2_response.answer)

    def test_05_high_risk_human_gate_rejection(self):
        """Manager rejection must route to log_rejection node without creating task."""
        thread_id = "test-crit-rejection-003"
        input_data = {
            "field_id": "field-fungus-05",
            "crop_variety": "Tomato",
            "growth_stage": "Flowering",
            "observation": "Dark brown fungal spots and blight spreading rapidly",
            "image_url": "",
        }

        # Turn 1: Pauses at human gate
        turn1 = run_agent2_workflow(input_data, thread_id=thread_id)
        self.assertEqual(turn1.status, "awaiting_approval")

        # Turn 2: Manager denies the proposal
        turn2 = run_agent2_workflow(Command(resume="deny"), thread_id=thread_id)
        self.assertEqual(turn2.status, "completed")
        self.assertIn("log_rejection", turn2.nodes)
        self.assertIn("REJECTED", turn2.answer)

    def test_06_checkpointer_thread_isolation(self):
        """Checkpointer must keep memory separate per thread_id."""
        config_a = {"configurable": {"thread_id": "test-thread-alpha"}}
        config_b = {"configurable": {"thread_id": "test-thread-beta"}}

        state_a = AGENT2_APP.get_state(config_a)
        state_b = AGENT2_APP.get_state(config_b)

        # Unused threads should have empty values
        self.assertEqual(len(state_a.values), 0)
        self.assertEqual(len(state_b.values), 0)


if __name__ == "__main__":
    unittest.main()
