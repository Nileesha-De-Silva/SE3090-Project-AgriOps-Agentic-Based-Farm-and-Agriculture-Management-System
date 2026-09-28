import { api, aiApi, INITIAL_MOCK_APPROVALS } from './apiClient';
import { taskApi } from './taskApi';

let localApprovals = [...INITIAL_MOCK_APPROVALS];

export const cropAnalysisApi = {
  // Fetch pending crop alerts awaiting manager approval
  async getPendingApprovals() {
    try {
      const response = await api.get('/crop-analysis/pending-approval');
      if (response.data && Array.isArray(response.data)) {
        localApprovals = response.data;
        return response.data;
      }
    } catch (err) {
      console.warn('Backend /api/crop-analysis unavailable, using local inbox:', err.message);
    }
    return localApprovals.filter((a) => a.status === 'AwaitingApproval');
  },

  // Manager Approves a high-risk analysis -> Dispatches farm task
  async approveAnalysis(analysisId, threadId, comments = 'Approved by Farm Manager.') {
    // 1. Inform Agent 2 via resume endpoint if threadId exists
    if (threadId) {
      try {
        await aiApi.post('/resume', {
          thread_id: threadId,
          decision: 'approve',
          comments,
        });
      } catch (err) {
        console.warn('Agent 2 /ai/resume call deferred:', err.message);
      }
    }

    // 2. Inform Backend
    try {
      await api.post(`/crop-analysis/${analysisId}/approve`, { comments });
    } catch (err) {
      console.warn('Backend /api/crop-analysis/approve deferred:', err.message);
    }

    // 3. Mark approved locally & create corresponding task on Kanban
    const target = localApprovals.find((a) => a.id === analysisId);
    if (target) {
      target.status = 'Approved';
      // Automatically create the suggested task
      await taskApi.createTask({
        title: `${target.suggestedTaskType}: ${target.primaryIndicator}`,
        description: `${target.recommendedProtocol} (Field: ${target.fieldId}, Variety: ${target.cropVariety}).`,
        taskType: target.suggestedTaskType,
        priority: target.priority,
        fieldId: target.fieldId,
        cropVariety: target.cropVariety,
        estimatedHours: 3.5,
        sourceCropAnalysisId: target.id,
      });
    }

    return { success: true, analysisId };
  },

  // Manager Rejects a diagnosis proposal
  async rejectAnalysis(analysisId, threadId, reason = 'Alternative treatment determined by manager.') {
    if (threadId) {
      try {
        await aiApi.post('/resume', {
          thread_id: threadId,
          decision: 'deny',
          comments: reason,
        });
      } catch (err) {
        console.warn('Agent 2 /ai/resume call deferred:', err.message);
      }
    }

    try {
      await api.post(`/crop-analysis/${analysisId}/reject`, { reason });
    } catch (err) {
      console.warn('Backend /api/crop-analysis/reject deferred:', err.message);
    }

    const target = localApprovals.find((a) => a.id === analysisId);
    if (target) {
      target.status = 'Rejected';
    }

    return { success: true, analysisId };
  },

  // Trigger real-time Agent 2 diagnosis over /ai/analyze
  async analyzeCropObservation(data) {
    const threadId = `web-${Date.now()}`;
    const payload = {
      field_id: data.fieldId,
      crop_variety: data.cropVariety,
      growth_stage: data.growthStage,
      observation: data.observation,
      image_url: data.imageUrl || '',
      thread_id: threadId,
    };

    try {
      const response = await aiApi.post('/analyze', payload);
      const graphRes = response.data;

      // If the agent paused at the human gate, append to approvals inbox
      if (graphRes.status === 'awaiting_approval' && graphRes.interrupt) {
        const newApproval = {
          id: `ana-${Date.now().toString().slice(-4)}`,
          threadId: graphRes.thread_id,
          fieldId: data.fieldId,
          cropVariety: data.cropVariety,
          growthStage: data.growthStage,
          observation: data.observation,
          primaryIndicator: graphRes.interrupt.primary_indicator || 'High Risk Agronomic Issue',
          category: 'Disease/Pest',
          riskLevel: graphRes.interrupt.risk_level || 'High',
          suggestedTaskType: graphRes.interrupt.suggested_task_type || 'PestInspection',
          priority: graphRes.interrupt.risk_level === 'Critical' ? 'Critical' : 'High',
          confidenceScore: 0.93,
          recommendedProtocol: graphRes.interrupt.protocol || 'Inspect and isolate affected rows immediately.',
          sourceHandbook: '[Field-Handbook]',
          status: 'AwaitingApproval',
          detectedAt: new Date().toISOString(),
        };
        localApprovals.unshift(newApproval);
      }

      return graphRes;
    } catch (err) {
      console.warn('Agent 2 /ai/analyze offline, producing simulated diagnosis:', err.message);
      // Simulated response if agent offline
      return {
        status: 'completed',
        answer: `[Tomato-Handbook] Simulated Diagnosis for ${data.cropVariety} on Field ${data.fieldId}: Mild physiological stress observed. Monitor soil moisture levels.`,
        nodes: ['input_guard', 'retrieve', 'grade', 'generate_diagnosis', 'dispatch_task'],
        thread_id: threadId,
        total_tokens: 284,
      };
    }
  },
};
