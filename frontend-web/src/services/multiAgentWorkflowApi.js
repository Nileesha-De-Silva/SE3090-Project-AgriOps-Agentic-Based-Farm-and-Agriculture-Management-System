import { authHeaders } from './authToken';

const BASE_URL = import.meta.env.VITE_API_URL || '/api';

export async function getWorkflowSpecification() {
  const res = await fetch(`${BASE_URL}/multi-agent/specification`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(`Failed to load specification: ${res.status}`);
  return res.json();
}

export async function executeAssessedWorkflow(payload) {
  const res = await fetch(`${BASE_URL}/multi-agent/execute-assessed-workflow`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `Workflow execution failed with status ${res.status}`);
  }
  return res.json();
}

export async function resumeAssessedWorkflow(workflowId, decision, managerNotes = '') {
  const res = await fetch(`${BASE_URL}/multi-agent/assessed-workflow/${workflowId}/resume`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
    body: JSON.stringify({ decision, managerNotes }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `Workflow resume failed with status ${res.status}`);
  }
  return res.json();
}

export async function getWorkflowState(workflowId) {
  const res = await fetch(`${BASE_URL}/multi-agent/assessed-workflow/${workflowId}`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(`Failed to load workflow state: ${res.status}`);
  return res.json();
}
