"""Docker-compatible entry point for the persistent inventory workflow.

Keep `uvicorn main:app` working while using the same authenticated LangGraph
application as local development and the inventory regression tests.
"""
from app.main import app, create_app

__all__ = ["app", "create_app"]
