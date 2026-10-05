import { setToken } from "./authToken";

const BASE_URL = "http://localhost:5289/api"; // same backend as the farm API client

async function handleResponse(res) {
  if (!res.ok) {
    const errorBody = await res.json().catch(() => null);
    const message = errorBody?.message || errorBody?.title || `Request failed with status ${res.status}`;
    throw new Error(message);
  }
  if (res.status === 204) return null;
  return res.json();
}

export async function login(username, password) {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  const data = await handleResponse(res);
  setToken(data.token);
  return data; // { token, userId, username, roles }
}

export async function register(payload) {
  const res = await fetch(`${BASE_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await handleResponse(res);
  setToken(data.token);
  return data;
}

export function logout() {
  setToken(null);
}