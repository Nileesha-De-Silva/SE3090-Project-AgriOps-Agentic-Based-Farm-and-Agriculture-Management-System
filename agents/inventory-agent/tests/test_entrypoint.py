"""Exercise the entry point actually launched by Docker."""
from main import app, create_app
from app.main import app as original_app
from fastapi.testclient import TestClient
from test_agent import rig, body, headers


def test_docker_uses_original_application():
    assert app is original_app


def test_entrypoint_preserves_auth_persistence_and_approval(rig):
    settings, backend, model = rig
    request = body()
    with TestClient(create_app(settings, backend, model)) as client:
        assert client.get('/access').status_code == 401
        assert client.get('/access', headers=headers('worker')).status_code == 403
        assert client.get('/access', headers=headers()).status_code == 200
        assert client.post('/recommend', json=request).status_code == 401
        result = client.post('/recommend', json=request, headers=headers())
        assert result.status_code == 200
        data = result.json()
        assert data['runId'] == data['run_id'] == request['request_id']
        assert data['quantity'] == '15'
        assert model.calls == 1
        assert data['status'] == 'awaiting_approval'
        assert len(backend.records) == 1
        resume = f"/runs/{data['runId']}/resume"
        assert client.post(resume, headers=headers()).status_code == 409
        assert client.get(f"/runs/{data['runId']}", headers=headers('manager-b')).status_code == 404
    with TestClient(create_app(settings, backend, model)) as client:
        saved = client.get(f"/runs/{data['runId']}", headers=headers()).json()
        assert saved['status'] == 'awaiting_approval'
        backend.records[request['request_id']]['status'] = 'Rejected'
        assert client.post(resume, headers=headers()).json()['status'] == 'rejected'


def test_entrypoint_accepts_omitted_request_id(rig):
    settings, backend, model = rig
    request = body()
    del request['request_id']
    with TestClient(create_app(settings, backend, model)) as client:
        result = client.post('/recommend', json=request, headers=headers())
        assert result.status_code == 200
        data = result.json()
        assert data['runId'] == data['run_id']
        assert client.get(f"/runs/{data['runId']}", headers=headers()).status_code == 200
