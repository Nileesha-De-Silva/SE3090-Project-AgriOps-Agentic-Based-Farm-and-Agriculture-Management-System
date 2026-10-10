"""Pytest configuration and environment setup for inventory-agent tests."""
import sys
from pathlib import Path

tests_dir = Path(__file__).resolve().parent
agent_dir = tests_dir.parent

if str(tests_dir) not in sys.path:
    sys.path.insert(0, str(tests_dir))
if str(agent_dir) not in sys.path:
    sys.path.insert(0, str(agent_dir))
