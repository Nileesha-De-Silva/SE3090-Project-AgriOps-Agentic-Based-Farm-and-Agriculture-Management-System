"""
Unit tests for Agent 2 Crop Diagnostic Subsystem.
"""

import sys
import os
import unittest

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from agents.schemas.crop_analysis_contracts import CropSymptomInput, CropAnalysisReport
from agents.tools.symptom_mapping_tool import map_symptoms_to_diagnosis
from agents.agent2_crop_analysis import run_crop_analysis_agent


class TestCropAnalysisAgent(unittest.TestCase):

    def test_symptom_mapping_tool_yellow_leaves(self):
        indicator, risk, factors, actions, task_type, priority = map_symptoms_to_diagnosis("Leaves showing pale yellowing and chlorosis")
        self.assertEqual(risk, "Medium")
        self.assertEqual(task_type, "Fertilization")
        self.assertEqual(priority, "Medium")

    def test_symptom_mapping_tool_pest_infestation(self):
        indicator, risk, factors, actions, task_type, priority = map_symptoms_to_diagnosis("Pest bugs and caterpillars chewing holes in tomato leaves")
        self.assertEqual(risk, "Critical")
        self.assertEqual(task_type, "PestInspection")
        self.assertEqual(priority, "Critical")

    def test_symptom_mapping_tool_water_stress(self):
        indicator, risk, factors, actions, task_type, priority = map_symptoms_to_diagnosis("Soil is dry and parched, leaves wilting")
        self.assertEqual(risk, "High")
        self.assertEqual(task_type, "Watering")

    def test_agent2_end_to_end_execution(self):
        inp = CropSymptomInput(
            field_id="field-101",
            crop_variety="Tomato",
            growth_stage="Fruiting",
            symptom_description="Dark fungal spots and white mold on lower leaves",
            image_url="http://example.com/photo.jpg",
            submitted_by_user_id="user-999"
        )

        report = run_crop_analysis_agent(inp)

        self.assertIsInstance(report, CropAnalysisReport)
        self.assertEqual(report.field_id, "field-101")
        self.assertEqual(report.crop_variety, "Tomato")
        self.assertEqual(report.suggested_task_type, "PestInspection")
        self.assertEqual(report.status, "PendingApproval")
        self.assertTrue(len(report.stress_factors) > 0)
        self.assertTrue(len(report.recommended_actions) > 0)


if __name__ == "__main__":
    unittest.main()
