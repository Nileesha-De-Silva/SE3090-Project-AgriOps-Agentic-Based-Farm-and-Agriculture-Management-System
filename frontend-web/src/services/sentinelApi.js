import { authHeaders } from './authToken';

const BASE_URL = '/api/analytics-agent';

export async function runSentinelAnalysis(payload = {}) {
  const response = await fetch(`${BASE_URL}/analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
    body: JSON.stringify({
      sensitivity_threshold: payload.sensitivityThreshold ?? 0.20,
      audit_lookback_count: payload.auditLookbackCount ?? 50,
      crop_name: payload.cropName || null,
      field_id: payload.fieldId || null,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Sentinel analysis failed with status ${response.status}`);
  }

  return response.json();
}

export async function getSentinelRun(runId) {
  const response = await fetch(`${BASE_URL}/runs/${runId}`, {
    headers: {
      ...authHeaders(),
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to fetch run status: ${response.status}`);
  }

  return response.json();
}

export async function approveSentinelIntervention(runId, managerNotes = '') {
  const response = await fetch(`${BASE_URL}/runs/${runId}/approve`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
    body: JSON.stringify({
      action: 'approve',
      manager_notes: managerNotes,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to approve intervention: ${response.status}`);
  }

  return response.json();
}

export async function rejectSentinelIntervention(runId, managerNotes = '') {
  const response = await fetch(`${BASE_URL}/runs/${runId}/reject`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
    body: JSON.stringify({
      action: 'reject',
      manager_notes: managerNotes,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to reject intervention: ${response.status}`);
  }

  return response.json();
}
