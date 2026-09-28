import { authHeaders } from "./authToken";

const BASE_URL = "http://localhost:5289/api";

async function handleResponse(res) {
  if (!res.ok) {
    const errorBody = await res.json().catch(() => null);
    const message = errorBody?.message || errorBody?.title || `Request failed with status ${res.status}`;
    throw new Error(message);
  }
  if (res.status === 204) return null;
  return res.json();
}

// ---------- Users ----------
export async function getUsers() {
  const res = await fetch(`${BASE_URL}/users`, { headers: authHeaders() });
  return handleResponse(res);
}

export async function getMe() {
  const res = await fetch(`${BASE_URL}/users/me`, { headers: authHeaders() });
  return handleResponse(res);
}

export async function setUserStatus(id, isActive) {
  const res = await fetch(`${BASE_URL}/users/${id}/status?isActive=${isActive}`, {
    method: "PUT",
    headers: authHeaders(),
  });
  return handleResponse(res);
}

export async function setUserRoles(id, roleNames) {
  const res = await fetch(`${BASE_URL}/users/${id}/roles`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ roleNames }),
  });
  return handleResponse(res);
}

// ---------- Roles ----------
export async function getRoles() {
  const res = await fetch(`${BASE_URL}/roles`, { headers: authHeaders() });
  return handleResponse(res);
}

// ---------- Audit Logs ----------
export async function getAuditLogs({ actionType, userId, skip = 0, take = 50 } = {}) {
  const params = new URLSearchParams();
  if (actionType) params.append("actionType", actionType);
  if (userId) params.append("userId", userId);
  params.append("skip", skip);
  params.append("take", take);
  const res = await fetch(`${BASE_URL}/auditlogs?${params.toString()}`, { headers: authHeaders() });
  return handleResponse(res);
}

// ---------- Analytics ----------
export async function getHarvestYields() {
  const res = await fetch(`${BASE_URL}/analytics/harvest-yields`, { headers: authHeaders() });
  return handleResponse(res);
}