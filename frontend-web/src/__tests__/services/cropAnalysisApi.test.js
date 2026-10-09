import { describe, it, expect, vi, beforeEach } from 'vitest';
import { cropAnalysisApi } from '../../services/cropAnalysisApi';
import { api, aiApi } from '../../services/apiClient';
import { taskApi } from '../../services/taskApi';

vi.mock('../../services/apiClient', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
  },
  aiApi: {
    post: vi.fn(),
  },
  INITIAL_MOCK_APPROVALS: [],
}));

vi.mock('../../services/taskApi', () => ({
  taskApi: {
    createTask: vi.fn(),
  },
}));

describe('Crop Analysis API & Agent 2 Gatekeeper (Component 2)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getPendingApprovals fetches awaiting approvals from backend', async () => {
    const mockApprovals = [
      {
        id: 'ana-101',
        primaryIndicator: 'Blight on Tomato',
        status: 'AwaitingApproval',
      },
    ];
    api.get.mockResolvedValue({ data: mockApprovals });

    const result = await cropAnalysisApi.getPendingApprovals();
    expect(result).toHaveLength(1);
    expect(result[0].primaryIndicator).toBe('Blight on Tomato');
    expect(api.get).toHaveBeenCalledWith('/crop-analysis/pending-approval');
  });

  it('approveAnalysis posts to backend, Agent 2 resume endpoint, and dispatches remediation task', async () => {
    const mockItem = {
      id: 'ana-test-01',
      threadId: 'th-test-01',
      fieldId: 'field-1',
      cropVariety: 'Tomato',
      primaryIndicator: 'Late Blight Outbreak',
      recommendedProtocol: 'Apply targeted bio-fungicide',
      suggestedTaskType: 'PesticideApplication',
      priority: 'High',
      status: 'AwaitingApproval',
    };

    // Populate local cache via getPendingApprovals
    api.get.mockResolvedValue({ data: [mockItem] });
    await cropAnalysisApi.getPendingApprovals();

    api.post.mockResolvedValue({ data: { success: true } });
    aiApi.post.mockResolvedValue({ data: { success: true } });
    taskApi.createTask.mockResolvedValue({ id: 'remediation-task-1' });

    const result = await cropAnalysisApi.approveAnalysis(
      'ana-test-01',
      'th-test-01',
      'Approved for emergency spray'
    );

    expect(result.success).toBe(true);
    expect(aiApi.post).toHaveBeenCalledWith('/resume', {
      thread_id: 'th-test-01',
      decision: 'approve',
      comments: 'Approved for emergency spray',
    });
    expect(api.post).toHaveBeenCalledWith('/crop-analysis/ana-test-01/approve', {
      comments: 'Approved for emergency spray',
    });
    expect(taskApi.createTask).toHaveBeenCalledWith(
      expect.objectContaining({
        taskType: 'PesticideApplication',
        sourceCropAnalysisId: 'ana-test-01',
      })
    );
  });

  it('rejectAnalysis posts to backend rejection endpoint and denies Agent 2 thread', async () => {
    const mockItem = {
      id: 'ana-test-02',
      threadId: 'th-test-02',
      fieldId: 'field-2',
      status: 'AwaitingApproval',
    };
    api.get.mockResolvedValue({ data: [mockItem] });
    await cropAnalysisApi.getPendingApprovals();

    api.post.mockResolvedValue({ data: { success: true } });
    aiApi.post.mockResolvedValue({ data: { success: true } });

    const result = await cropAnalysisApi.rejectAnalysis(
      'ana-test-02',
      'th-test-02',
      'Not severe enough for chemical action'
    );

    expect(result.success).toBe(true);
    expect(aiApi.post).toHaveBeenCalledWith('/resume', {
      thread_id: 'th-test-02',
      decision: 'deny',
      comments: 'Not severe enough for chemical action',
    });
    expect(api.post).toHaveBeenCalledWith('/crop-analysis/ana-test-02/reject', {
      reason: 'Not severe enough for chemical action',
    });
  });

  it('analyzeCropObservation posts observation to Agent 2 /analyze endpoint', async () => {
    const mockAgentResponse = {
      status: 'awaiting_approval',
      thread_id: 'th-web-42',
      interrupt: {
        primary_indicator: 'Caterpillar Feeding Damage',
        risk_level: 'Critical',
        suggested_task_type: 'PesticideApplication',
        protocol: 'Deploy Bacillus thuringiensis',
      },
    };
    aiApi.post.mockResolvedValue({ data: mockAgentResponse });

    const result = await cropAnalysisApi.analyzeCropObservation({
      fieldId: 'field-10',
      cropVariety: 'Tomato',
      growthStage: 'Fruiting',
      observation: 'Worms eating fruits',
    });

    expect(result.status).toBe('awaiting_approval');
    expect(aiApi.post).toHaveBeenCalledWith(
      '/analyze',
      expect.objectContaining({
        field_id: 'field-10',
        crop_variety: 'Tomato',
        observation: 'Worms eating fruits',
      })
    );
  });

  it('analyzeCropObservation falls back to local simulation when Agent 2 is offline', async () => {
    aiApi.post.mockRejectedValue(new Error('Network Connection Refused'));

    const result = await cropAnalysisApi.analyzeCropObservation({
      fieldId: 'field-north-1',
      cropVariety: 'Tomato',
      growthStage: 'Vegetative',
      observation: 'routine check',
    });

    expect(result.status).toBe('completed');
    expect(result.answer).toContain('Simulated Diagnosis');
  });
});
