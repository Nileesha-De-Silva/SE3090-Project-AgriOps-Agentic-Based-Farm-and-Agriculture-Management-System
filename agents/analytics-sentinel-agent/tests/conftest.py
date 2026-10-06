import sys
from pathlib import Path

# Add agent root directory to sys.path
agent_root = Path(__file__).resolve().parents[1]
if str(agent_root) not in sys.path:
    sys.path.insert(0, str(agent_root))
