"""HTTP backend client communicating with ASP.NET Core API."""

from typing import Any
import httpx
from app.config import Settings


class BackendError(Exception):
    def __init__(self, status: int, message: str):
        super().__init__(message)
        self.status = status
        self.message = message


class BackendClient:
    def __init__(self, settings: Settings):
        self._base_url = settings.backend_api_url.rstrip("/")
        self._timeout = settings.backend_timeout_seconds
        self._client = httpx.Client(timeout=self._timeout)

    def close(self):
        self._client.close()

    def fetch_harvest_yields(self, token: str | None = None) -> list[dict[str, Any]]:
        url = f"{self._base_url}/analytics/harvest-yields"
        headers = {}
        if token:
            headers["Authorization"] = f"Bearer {token}"
        try:
            response = self._client.get(url, headers=headers)
            if response.status_code == 200:
                return response.json()
            # If backend error or unauthenticated, return empty list gracefully
            return []
        except Exception:
            return []

    def fetch_audit_logs(self, token: str | None = None, take: int = 50) -> list[dict[str, Any]]:
        url = f"{self._base_url}/auditlogs?take={take}"
        headers = {}
        if token:
            headers["Authorization"] = f"Bearer {token}"
        try:
            response = self._client.get(url, headers=headers)
            if response.status_code == 200:
                return response.json()
            return []
        except Exception:
            return []

    def create_farm_task(self, task_payload: dict[str, Any], token: str | None = None) -> dict[str, Any] | None:
        url = f"{self._base_url}/tasks"
        headers = {"Content-Type": "application/json"}
        if token:
            headers["Authorization"] = f"Bearer {token}"
        try:
            response = self._client.post(url, json=task_payload, headers=headers)
            if response.status_code in {200, 201}:
                return response.json()
            return None
        except Exception:
            return None
