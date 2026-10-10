import httpx
import pytest
from app.config import Settings
from app.backend_client import BackendClient, BackendError

def client(handler):
    result = BackendClient(Settings(backend_client_id="inventory.agent", backend_client_secret="s" * 64))
    result.http.close()
    result.http = httpx.Client(base_url="http://localhost/api/", transport=httpx.MockTransport(handler))
    return result

def test_token_cached_then_renewed():
    calls = []
    def handler(request):
        calls.append(request.url.path)
        if request.url.path.endswith("service-token"):
            return httpx.Response(200, json={"accessToken": "service-token", "expiresIn": 600})
        assert request.headers["authorization"] == "Bearer service-token"
        return httpx.Response(200, json={})
    c = client(handler)
    c._request("GET", "context")
    c._request("GET", "context")
    assert calls.count("/api/inventory-agent/service-token") == 1
    c._expires = 0
    c._request("GET", "context")
    assert calls.count("/api/inventory-agent/service-token") == 2
    c.close()

def test_rejected_service_token_renews_once():
    issued, reads = [], []
    def handler(request):
        if request.url.path.endswith("service-token"):
            issued.append(1)
            return httpx.Response(200, json={"accessToken": str(len(issued)), "expiresIn": 600})
        reads.append(1)
        return httpx.Response(401 if len(reads) == 1 else 200, json={})
    c=client(handler)
    assert c._request("GET", "context") == {}
    assert len(issued) == len(reads) == 2
    c.close()

def test_manager_token_never_replaced():
    calls=[]
    def handler(request):
        calls.append(request.url.path)
        assert request.headers["authorization"] == "Bearer manager"
        return httpx.Response(401)
    c=client(handler)
    with pytest.raises(BackendError): c._request("GET", "access", token="manager")
    assert calls == ["/api/access"]
    c.close()

def test_bad_credentials_do_not_fall_back():
    c=client(lambda request: httpx.Response(401))
    with pytest.raises(BackendError, match="service_authentication_failed"):
        c._request("GET", "context")
    c.close()

def test_service_credentials_make_agent_ready():
    assert Settings(backend_client_id="inventory.agent", backend_client_secret="s" * 64,
        gemini_api_key="test", chat_model="test").ready
