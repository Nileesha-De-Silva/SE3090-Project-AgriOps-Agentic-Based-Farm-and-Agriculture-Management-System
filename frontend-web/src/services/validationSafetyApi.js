import { authHeaders } from './authToken';

const BASE_URL = import.meta.env.VITE_API_URL || '/api';

export async function getLiveWeather(lat = 6.9271, lon = 79.8612) {
  const res = await fetch(`${BASE_URL}/validation-safety/weather?latitude=${lat}&longitude=${lon}`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(`Weather fetch failed: ${res.status}`);
  return res.json();
}

export async function validateProposal(payload) {
  const res = await fetch(`${BASE_URL}/validation-safety/validate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `Validation failed with status ${res.status}`);
  }
  return res.json();
}

export async function getValidationHistory(take = 50) {
  const res = await fetch(`${BASE_URL}/validation-safety/history?take=${take}`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(`Failed to fetch validation history: ${res.status}`);
  return res.json();
}

export async function approveValidationProposal(validationId, managerNotes = '') {
  const res = await fetch(`${BASE_URL}/validation-safety/${validationId}/approve`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
    body: JSON.stringify({ managerNotes }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `Approval failed with status ${res.status}`);
  }
  return res.json();
}
