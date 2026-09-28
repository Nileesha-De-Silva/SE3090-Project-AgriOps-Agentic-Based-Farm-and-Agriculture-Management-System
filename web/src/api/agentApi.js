const AGENT_URL = import.meta.env.VITE_AGENT_API_URL || "http://localhost:8001";

async function handleResponse(response) {
  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;
    try {
      const body = await response.json();
      message = body.message || body.error || body.detail || message;
    } catch {
      // response body wasn't JSON — fall back to the status-based message
    }
    throw new Error(message);
  }
  return response.json();
}

/**
 * Ask the AI agent to generate a farm plan for a given field + crop season.
 *
 * Actual response shape from the FastAPI service:
 * {
 *   threadId: string,
 *   recommendedSchedule: { fieldId, cropSeasonId, generatedAt, tasks: string[], basedOnGrowthStage, basedOnWeather },
 *   approvalRequired: boolean,
 *   trace: [{ timestamp, message }],
 * }
 */
export async function generatePlan(fieldId, cropSeasonId) {
  const response = await fetch(`${AGENT_URL}/plan`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ field_id: fieldId, crop_season_id: cropSeasonId }),
  });
  return handleResponse(response);
}