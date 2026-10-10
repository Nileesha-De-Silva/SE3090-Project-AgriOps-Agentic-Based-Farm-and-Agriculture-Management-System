import hashlib
import threading
import time
from uuid import UUID

import httpx

from app.config import Settings


class BackendError(RuntimeError):
    def __init__(self, code: str, status: int = 502):
        self.code, self.status = code, status
        super().__init__(code)


class BackendClient:
    """Fixed routes only. No approve, purchase, stock mutation or arbitrary-URL tools."""

    def __init__(self, settings: Settings):
        self.settings = settings
        self._token = ""
        self._expires = 0.0
        self._token_lock = threading.Lock()
        self.http = httpx.Client(base_url=settings.backend_api_url.rstrip("/") + "/",
                                 timeout=settings.backend_timeout_seconds, follow_redirects=False,
                                 trust_env=False)

    def close(self):
        self.http.close()

    def _service_token(self, force=False):
        if not (self.settings.backend_client_id and self.settings.backend_client_secret):
            return self.settings.backend_agent_token
        with self._token_lock:
            if not force and self._token and time.monotonic() < self._expires:
                return self._token
            try:
                response = self.http.post("inventory-agent/service-token", json={
                    "clientId": self.settings.backend_client_id,
                    "clientSecret": self.settings.backend_client_secret})
                if response.status_code != 200:
                    raise BackendError("service_authentication_failed", 503)
                data = response.json()
                token, lifetime = data["accessToken"], int(data["expiresIn"])
                if not isinstance(token, str) or not token or lifetime <= 60:
                    raise ValueError("invalid token response")
                self._token, self._expires = token, time.monotonic() + lifetime - 60
                return token
            except httpx.HTTPError as exc:
                raise BackendError("backend_unreachable") from exc
            except (ValueError, KeyError, TypeError) as exc:
                raise BackendError("invalid_backend_response") from exc

    def _request(self, method: str, path: str, *, token: str | None = None, payload=None):
        try:
            result = self.http.request(method, path, json=payload,
                headers={"Authorization": f"Bearer {token if token is not None else self._service_token()}"})
        except httpx.HTTPError as exc:
            raise BackendError("backend_unreachable") from exc
        if result.status_code == 401 and token is None and self.settings.backend_client_id and self.settings.backend_client_secret:
            try:
                result = self.http.request(method, path, json=payload,
                    headers={"Authorization": f"Bearer {self._service_token(force=True)}"})
            except httpx.HTTPError as exc:
                raise BackendError("backend_unreachable") from exc
        if result.status_code >= 300:
            code = {401: "backend_unauthorized", 403: "backend_forbidden", 404: "resource_not_found",
                    409: "backend_conflict", 400: "backend_validation_failed"}.get(result.status_code, "backend_error")
            raise BackendError(code, result.status_code if result.status_code in {400, 401, 403, 404, 409} else 502)
        try:
            return result.json()
        except ValueError as exc:
            raise BackendError("invalid_backend_response") from exc

    def manager_owner(self, bearer: str) -> str:
        # Backend performs signature/issuer/audience/role validation; never decode an unverified JWT.
        identity = self._request("GET", "inventory-agent/access", token=bearer)
        if not identity.get("subject") or not identity.get("issuer"):
            raise BackendError("invalid_backend_identity")
        return hashlib.sha256((identity["issuer"] + "\0" + identity["subject"]).encode()).hexdigest()

    def automation_owner(self, bearer: str) -> str:
        identity = self._request("GET", "inventory-agent/automation-access", token=bearer)
        if not identity.get("subject") or not identity.get("issuer"):
            raise BackendError("invalid_backend_identity")
        return "automatic:" + hashlib.sha256((identity["issuer"] + "\0" + identity["subject"]).encode()).hexdigest()

    def context(self, item_id: str) -> dict:
        return self._request("GET", f"inventory-agent/items/{UUID(item_id)}/context")

    def submit(self, payload: dict) -> dict:
        return self._request("POST", "reorder-recommendations", payload=payload)

    def recommendation(self, recommendation_id: str) -> dict:
        return self._request("GET", f"reorder-recommendations/{UUID(recommendation_id)}")
