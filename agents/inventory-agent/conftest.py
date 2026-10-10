"""Pytest root configuration for inventory-agent."""
import sys
from pathlib import Path

agent_dir = Path(__file__).resolve().parent
tests_dir = agent_dir / "tests"

if str(tests_dir) not in sys.path:
    sys.path.insert(0, str(tests_dir))
if str(agent_dir) not in sys.path:
    sys.path.insert(0, str(agent_dir))
