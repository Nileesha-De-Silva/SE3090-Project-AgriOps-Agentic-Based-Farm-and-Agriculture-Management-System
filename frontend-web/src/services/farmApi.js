import { authHeaders } from "./authToken";

const BASE_URL = import.meta.env.VITE_API_URL || "/api";

async function request(path, options = {}) {
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers: {
        Accept: "application/json",
        ...authHeaders(),
        ...(options.headers || {}),
      },
    });

    if (!res.ok) {
      const errorBody = await res.json().catch(() => null);
      const message = errorBody?.message || errorBody?.title || `Request failed with status ${res.status}`;
      throw new Error(message);
    }
    if (res.status === 204) return null; // No Content
    return await res.json();
  } catch (err) {
    if (err.message && !err.message.includes("NetworkError") && !err.message.includes("Failed to fetch")) {
      throw err;
    }
    throw new Error("Unable to connect to the farm management service. Please check that the AgriOps backend server is running.");
  }
}

// ---------- Farms ----------
export async function getFarms() {
  return request("/farm");
}

export async function getFarm(id) {
  return request(`/farm/${id}`);
}

export async function createFarm(data) {
  return request("/farm", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function updateFarm(id, data) {
  return request(`/farm/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function deleteFarm(id) {
  return request(`/farm/${id}`, { method: "DELETE" });
}

// ---------- Fields ----------
export async function getFields(farmId) {
  const url = farmId ? `/field?farmId=${farmId}` : "/field";
  return request(url);
}

export async function createField(data) {
  return request("/field", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

// ---------- Crops ----------
export async function getCrops() {
  return request("/crop");
}

export async function createCrop(data) {
  return request("/crop", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

// ---------- Crop Seasons ----------
export async function getCropSeasons(fieldId, status) {
  const params = new URLSearchParams();
  if (fieldId) params.append("fieldId", fieldId);
  if (status) params.append("status", status);
  const query = params.toString() ? `?${params.toString()}` : "";
  return request(`/cropseason${query}`);
}

export async function getCropSeason(id) {
  return request(`/cropseason/${id}`);
}

export async function createCropSeason(data) {
  return request("/cropseason", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

// ---------- Plantings ----------
export async function getPlantings(cropSeasonId) {
  return request(`/cropseason/${cropSeasonId}/planting`);
}

export async function createPlanting(cropSeasonId, data) {
  return request(`/cropseason/${cropSeasonId}/planting`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

// ---------- Harvests ----------
export async function getHarvests(cropSeasonId) {
  return request(`/cropseason/${cropSeasonId}/harvest`);
}

export async function createHarvest(cropSeasonId, data) {
  return request(`/cropseason/${cropSeasonId}/harvest`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

// ---------- Soil Records ----------
export async function getSoilRecords(fieldId) {
  return request(`/field/${fieldId}/soilrecord`);
}
