import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
sys.path.insert(0, str(Path(__file__).resolve().parent))

from uuid import uuid4
import httpx
import pytest
from fastapi.testclient import TestClient
from main import create_app
from app.backend_client import BackendClient, BackendError
from test_agent import rig, headers, ITEM
from test_demand import evidence


def setup(rig):
    settings, backend, model = rig
    backend.evidence = evidence(backend)
    backend.evidence['item']['currentStock'] = '27.99'
    backend.evidence['incomingQuantity'] = '0'
    def owner(token):
        if token != 'service': raise BackendError('backend_forbidden', 403)
        return 'automatic:service'
    backend.automation_owner = owner
    return settings, backend, model


def request():
    return {'request_id': str(uuid4()), 'inventory_item_id': ITEM, 'safety_days': 14}


def test_automatic_auth_and_pending_proposal(rig):
    settings, backend, model = setup(rig)
    body = request()
    with TestClient(create_app(settings, backend, model)) as client:
        assert client.post('/automatic/recommend', json=body).status_code == 401
        assert client.post('/automatic/recommend', json=body, headers=headers()).status_code == 403
        result = client.post('/automatic/recommend', json=body, headers=headers('service'))
        assert result.status_code == 200, result.text
        assert result.json()['status'] == 'awaiting_approval'
        assert backend.payloads[0]['demand']['safetyDays'] == 14
        assert backend.payloads[0]['recommendedQuantity'] == '60.01'
        assert next(iter(backend.records.values()))['purchaseRequestId'] is None
        assert client.post('/automatic/recommend', json=body, headers=headers('service')).status_code == 200
        assert model.calls == 1 and len(backend.payloads) == 1
        # Service identity cannot approve through the manager resume route.
        assert client.post(f"/runs/{body['request_id']}/resume", headers=headers('service')).status_code == 403


@pytest.mark.parametrize('change,status', [
    ('equal', 'no_action'), ('above', 'no_action'), ('incoming', 'no_action'),
    ('short_history', 'blocked'), ('no_usage', 'blocked'), ('pending', 'blocked'), ('no_supplier', 'blocked')])
def test_automatic_guards(rig, change, status):
    settings, backend, model = setup(rig)
    if change == 'equal': backend.evidence['item']['currentStock'] = '28'
    if change == 'above': backend.evidence['item']['currentStock'] = '29'
    if change == 'incoming': backend.evidence['incomingQuantity'] = '0.01'
    if change == 'short_history': backend.evidence['historyDays'] = 27
    if change == 'no_usage': backend.evidence['usageLast28Days'] = '0'
    if change == 'pending': backend.evidence['pendingRecommendationId'] = str(uuid4())
    if change == 'no_supplier': backend.evidence['offers'] = []
    with TestClient(create_app(settings, backend, model)) as client:
        result = client.post('/automatic/recommend', json=request(), headers=headers('service'))
        assert result.status_code == 200, result.text
        assert result.json()['status'] == status
        assert model.calls == 0 and not backend.payloads


def test_automatic_failure_does_not_fabricate_recommendation(rig):
    settings, backend, model = setup(rig)
    model.choices = ['raise']
    with TestClient(create_app(settings, backend, model)) as client:
        result = client.post('/automatic/recommend', json=request(), headers=headers('service'))
        assert result.json()['status'] == 'failed'
        assert not backend.payloads


def test_automatic_rejects_manual_estimate(rig):
    settings, backend, model = setup(rig)
    with TestClient(create_app(settings, backend, model)) as client:
        assert client.post('/automatic/recommend', json={**request(), 'weekly_estimate': '5'}, headers=headers('service')).status_code == 422


def test_service_identity_validated_by_backend(rig):
    settings, _, _ = rig
    backend = BackendClient(settings)
    backend.http.close()
    def handler(req):
        assert req.url.path == '/api/inventory-agent/automation-access'
        assert req.headers['Authorization'] == 'Bearer service'
        return httpx.Response(200, json={'subject': 'agent', 'issuer': 'tests'})
    backend.http = httpx.Client(base_url='http://backend/api/', transport=httpx.MockTransport(handler))
    assert backend.automation_owner('service').startswith('automatic:')
    backend.close()
