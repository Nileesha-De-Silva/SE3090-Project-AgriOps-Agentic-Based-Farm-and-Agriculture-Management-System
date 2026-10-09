"""
AgriOps Component 2: Agentic AI Testing & Evaluation CLI Scorecard.
Executes and prints the 9-dimensional Agentic AI evaluation matrix.
"""

import sys
import time
from pathlib import Path

# Add root directory to path
sys.path.append(str(Path(__file__).resolve().parent))

import unittest
from tests.test_agentic_evaluation import TestAgenticAIEvaluation


def run_evaluation_scorecard():
    suite = unittest.TestLoader().loadTestsFromTestCase(TestAgenticAIEvaluation)
    runner = unittest.TextTestRunner(verbosity=0)

    print("=" * 80)
    print("AGRIOPS AI: COMPONENT 2 (NILEESHA DE SILVA) - AGENTIC AI EVALUATION SCORECARD")
    print("Agent: Agent 2 (Crop Analysis & Task Recommendation Agent)")
    print("Framework: pytest / unittest + Pydantic Schema Validation + Deterministic Probes")
    print("=" * 80)

    categories = [
        ("1. Task-Completion Testing", ["test_01", "test_02", "test_03"]),
        ("2. Agent Selection Testing", ["test_04", "test_05", "test_06", "test_07", "test_08"]),
        ("3. Tool-Selection Testing", ["test_09", "test_10", "test_11"]),
        ("4. Structured-Output Validation", ["test_12", "test_13", "test_14"]),
        ("5. Business Rule Compliance Testing", ["test_15", "test_16", "test_17"]),
        ("6. Prompt Injection Testing", ["test_18", "test_19", "test_20"]),
        ("7. Approval-Enforcement Testing", ["test_21", "test_22", "test_23"]),
        ("8. Failure-Recovery Testing", ["test_24", "test_25"]),
        ("9. Safe Failure Testing", ["test_26", "test_27"]),
    ]

    start_total = time.time()
    result = runner.run(suite)
    duration = time.time() - start_total

    print(f"\n{'Evaluation Dimension':<40} | {'Test Count':<12} | {'Result':<10}")
    print("-" * 80)

    for cat_name, prefixes in categories:
        count = len(prefixes)
        # Check if any failures in this category
        cat_failed = any(
            any(test.id().split(".")[-1].startswith(p) for p in prefixes)
            for test, _ in result.failures + result.errors
        )
        status = "PASSED [OK]" if not cat_failed else "FAILED [X]"
        print(f"{cat_name:<40} | {count:<12} | {status:<10}")

    print("-" * 80)
    print(f"Total Tests Executed : {result.testsRun}")
    print(f"Total Passed         : {result.testsRun - len(result.failures) - len(result.errors)}")
    print(f"Total Failures       : {len(result.failures)}")
    print(f"Total Errors         : {len(result.errors)}")
    print(f"Execution Duration   : {duration:.2f} seconds")
    print("=" * 80)

    if result.wasSuccessful():
        print(">>> ALL 9 AGENTIC AI TESTING & EVALUATION DIMENSIONS PASSED (100% SUCCESS) <<<")
    else:
        print(">>> EVALUATION SUITE FOUND FAILURES <<<")
        sys.exit(1)


if __name__ == "__main__":
    run_evaluation_scorecard()
