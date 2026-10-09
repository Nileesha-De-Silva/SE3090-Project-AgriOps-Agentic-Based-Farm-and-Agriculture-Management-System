"""
AgriOps Component 4: Agentic AI Testing & Evaluation CLI Scorecard (Sahas).
Executes and prints the 9-dimensional Agentic AI evaluation matrix for Agent 4 (The Validation & Safety Agent).
"""

import sys
import time
from pathlib import Path

# Add root directory of analytics-sentinel-agent to path
sys.path.insert(0, str(Path(__file__).resolve().parent))

import unittest
from tests.test_agent4_evaluation import TestAgent4Evaluation


def run_evaluation_scorecard():
    suite = unittest.TestLoader().loadTestsFromTestCase(TestAgent4Evaluation)
    runner = unittest.TextTestRunner(verbosity=0)

    print("=" * 80)
    print("AGRIOPS AI: COMPONENT 4 (SAHAS) - AGENTIC AI EVALUATION SCORECARD")
    print("Agent: Agent 4 (Validation & Safety Agent - Deterministic & Weather Firewall)")
    print("Location: agents/analytics-sentinel-agent")
    print("Framework: pytest / unittest + Pydantic Schema Validation + Deterministic Probes")
    print("=" * 80)

    categories = [
        ("1. Task-Completion Testing", ["test_01", "test_02", "test_03"]),
        ("2. Agent Selection Testing", ["test_04", "test_05", "test_06"]),
        ("3. Tool-Selection Testing", ["test_07", "test_08", "test_09"]),
        ("4. Structured-Output Validation", ["test_10", "test_11"]),
        ("5. Business Rule Compliance Testing", ["test_12", "test_13"]),
        ("6. Prompt Injection Testing", ["test_14"]),
        ("7. Approval-Enforcement Testing", ["test_15"]),
        ("8. Failure-Recovery Testing", ["test_16"]),
        ("9. Safe Failure Testing", ["test_17"]),
    ]

    start_total = time.time()
    result = runner.run(suite)
    duration = time.time() - start_total

    print(f"\n{'Evaluation Dimension':<40} | {'Test Count':<12} | {'Result':<10}")
    print("-" * 80)

    for cat_name, prefixes in categories:
        count = len(prefixes)
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

    if len(result.failures) == 0 and len(result.errors) == 0:
        print(">>> ALL 9 AGENTIC AI TESTING & EVALUATION DIMENSIONS PASSED (100% SUCCESS) <<<")
    else:
        print(">>> SOME TESTS FAILED. PLEASE REVIEW EVIDENCE LOGS ABOVE. <<<")
    print("=" * 80)


if __name__ == "__main__":
    run_evaluation_scorecard()
