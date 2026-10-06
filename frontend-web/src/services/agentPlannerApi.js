const AGENT_URL = import.meta.env.VITE_AGENT_API_URL || "/agent1";

async function handleResponse(response) {
  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;
    try {
      const body = await response.json();
      message = body.message || body.error || body.detail || message;
    } catch {
      // response body wasn't JSON — fall back to status-based message
    }
    throw new Error(message);
  }
  return response.json();
}

/**
 * Ask AI Agent 1 (Farm Planning Agent) to generate a farm plan for a given field + crop season.
 *
 * Response shape:
 * {
 *   threadId: string,
 *   recommendedSchedule: { fieldId, cropSeasonId, generatedAt, tasks: string[], basedOnGrowthStage, basedOnWeather },
 *   approvalRequired: boolean,
 *   trace: [{ timestamp, message }],
 * }
 */
export async function generatePlan(fieldId, cropSeasonId) {
  try {
    const response = await fetch(`${AGENT_URL}/plan`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ field_id: fieldId, crop_season_id: cropSeasonId }),
    });
    return await handleResponse(response);
  } catch (err) {
    if (err.message && !err.message.includes("NetworkError") && !err.message.includes("Failed to fetch")) {
      throw err;
    }
    throw new Error("Unable to connect to Farm Planning Agent (Agent 1). Please ensure the agriops-farm-planning-agent container is running on port 8001.");
  }
}
