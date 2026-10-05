const BASE_URL = "http://localhost:5289/api"; // your ASP.NET Core dev port

async function handleResponse(res) {
  if (!res.ok) {
    const errorBody = await res.json().catch(() => null);
    const message = errorBody?.message || errorBody?.title || `Request failed with status ${res.status}`;
    throw new Error(message);
  }
  if (res.status === 204) return null; // No Content
  return res.json();
}

// ---------- Farms ----------
export async function getFarms() {
  const res = await fetch(`${BASE_URL}/farm`);
  return handleResponse(res);
}

export async function getFarm(id) {
  const res = await fetch(`${BASE_URL}/farm/${id}`);
  return handleResponse(res);
}

export async function createFarm(data) {
  const res = await fetch(`${BASE_URL}/farm`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function updateFarm(id, data) {
  const res = await fetch(`${BASE_URL}/farm/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function deleteFarm(id) {
  const res = await fetch(`${BASE_URL}/farm/${id}`, { method: "DELETE" });
  return handleResponse(res);
}

// ---------- Fields ----------
export async function getFields(farmId) {
  const url = farmId ? `${BASE_URL}/field?farmId=${farmId}` : `${BASE_URL}/field`;
  const res = await fetch(url);
  return handleResponse(res);
}

export async function createField(data) {
  const res = await fetch(`${BASE_URL}/field`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

// ---------- Crops ----------
export async function getCrops() {
  const res = await fetch(`${BASE_URL}/crop`);
  return handleResponse(res);
}

export async function createCrop(data) {
  const res = await fetch(`${BASE_URL}/crop`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

// ---------- Crop Seasons ----------
export async function getCropSeasons(fieldId, status) {
  const params = new URLSearchParams();
  if (fieldId) params.append("fieldId", fieldId);
  if (status) params.append("status", status);
  const query = params.toString() ? `?${params.toString()}` : "";
  const res = await fetch(`${BASE_URL}/cropseason${query}`);
  return handleResponse(res);
}

export async function getCropSeason(id) {
  const res = await fetch(`${BASE_URL}/cropseason/${id}`);
  return handleResponse(res);
}

export async function createCropSeason(data) {
  const res = await fetch(`${BASE_URL}/cropseason`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

// ---------- Plantings ----------
export async function getPlantings(cropSeasonId) {
  const res = await fetch(`${BASE_URL}/cropseason/${cropSeasonId}/planting`);
  return handleResponse(res);
}

export async function createPlanting(cropSeasonId, data) {
  const res = await fetch(`${BASE_URL}/cropseason/${cropSeasonId}/planting`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

// ---------- Harvests ----------
export async function getHarvests(cropSeasonId) {
  const res = await fetch(`${BASE_URL}/cropseason/${cropSeasonId}/harvest`);
  return handleResponse(res);
}

export async function createHarvest(cropSeasonId, data) {
  const res = await fetch(`${BASE_URL}/cropseason/${cropSeasonId}/harvest`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

// ---------- Soil Records ----------
export async function getSoilRecords(fieldId) {
  const res = await fetch(`${BASE_URL}/field/${fieldId}/soilrecord`);
  return handleResponse(res);
}