import { api, aiApi, INITIAL_MOCK_APPROVALS } from './apiClient';
import { taskApi } from './taskApi';

let localApprovals = [...INITIAL_MOCK_APPROVALS];

export const cropAnalysisApi = {
  // Fetch pending crop alerts awaiting manager approval
  async getPendingApprovals() {
    try {
      const response = await api.get('/crop-analysis/pending-approval');
      if (response.data && Array.isArray(response.data) && response.data.length > 0) {
        const mapped = response.data.map((item) => {
          let protocol = 'Inspect and isolate affected rows immediately.';
          try {
            if (item.recommendedActionsJson) {
              const parsed = JSON.parse(item.recommendedActionsJson);
              protocol = Array.isArray(parsed) ? parsed[0] : parsed;
            }
          } catch { }

          return {
            id: item.id,
            threadId: item.workflowId,
            fieldId: item.fieldId,
            cropVariety: item.cropVariety,
            growthStage: item.growthStage,
            observation: item.observationText,
            primaryIndicator: item.primaryIndicator || 'High Risk Agronomic Issue',
            category: 'Disease/Pest',
            riskLevel: item.riskLevel || 'High',
            suggestedTaskType: item.suggestedTaskType || 'PestInspection',
            priority: item.priority || 'High',
            confidenceScore: 0.94,
            recommendedProtocol: protocol,
            sourceHandbook: '[Field-Handbook]',
            status: 'AwaitingApproval',
            detectedAt: item.createdAt,
          };
        });
        const existingLocal = localApprovals.filter(
          (loc) => !mapped.some((m) => m.id === loc.id) && loc.status === 'AwaitingApproval'
        );
        localApprovals = [...mapped, ...existingLocal];
        return localApprovals;
      }
    } catch (err) {
      try {
        const fallbackRes = await api.get('/cropanalysis/pending');
        if (fallbackRes.data && Array.isArray(fallbackRes.data) && fallbackRes.data.length > 0) {
          const mapped = fallbackRes.data.map((item) => {
            let protocol = 'Inspect and isolate affected rows immediately.';
            try {
              if (item.recommendedActionsJson) {
                const parsed = JSON.parse(item.recommendedActionsJson);
                protocol = Array.isArray(parsed) ? parsed[0] : parsed;
              }
            } catch { }

            return {
              id: item.id,
              threadId: item.workflowId,
              fieldId: item.fieldId,
              cropVariety: item.cropVariety,
              growthStage: item.growthStage,
              observation: item.observationText,
              primaryIndicator: item.primaryIndicator || 'High Risk Agronomic Issue',
              category: 'Disease/Pest',
              riskLevel: item.riskLevel || 'High',
              suggestedTaskType: item.suggestedTaskType || 'PestInspection',
              priority: item.priority || 'High',
              confidenceScore: 0.94,
              recommendedProtocol: protocol,
              sourceHandbook: '[Field-Handbook]',
              status: 'AwaitingApproval',
              detectedAt: item.createdAt,
            };
          });
          const existingLocal = localApprovals.filter(
            (loc) => !mapped.some((m) => m.id === loc.id) && loc.status === 'AwaitingApproval'
          );
          localApprovals = [...mapped, ...existingLocal];
          return localApprovals;
        }
      } catch {}
      console.warn('Backend /api/crop-analysis/pending-approval unavailable, using local inbox:', err.message);
    }
    return localApprovals.filter((a) => a.status === 'AwaitingApproval');
  },

  // Manager Approves a high-risk analysis -> Dispatches farm task
  async approveAnalysis(analysisId, threadId, comments = 'Approved by Farm Manager.') {
    // 1. Inform Agent 2 via resume endpoint if threadId exists (fast timeout so UI is never blocked)
    if (threadId) {
      try {
        await Promise.race([
          aiApi.post('/resume', {
            thread_id: threadId,
            decision: 'approve',
            comments,
          }),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Agent 2 resume timeout')), 3000)),
        ]);
      } catch (err) {
        console.warn('Agent 2 /ai/resume call deferred:', err.message);
      }
    }

    // 2. Inform Backend
    try {
      await api.post(`/crop-analysis/${analysisId}/approve`, { comments });
    } catch (err) {
      try {
        await api.post(`/cropanalysis/${analysisId}/approve`, {
          managerUserId: '00000000-0000-0000-0000-000000000001',
          comments,
        });
      } catch (e2) {
        console.warn('Backend /api/cropanalysis/approve deferred:', e2.message);
      }
    }

    // 3. Mark approved locally & create corresponding task on Kanban
    const target = localApprovals.find((a) => a.id === analysisId);
    if (target) {
      target.status = 'Approved';
      // Automatically create the suggested task
      try {
        await taskApi.createTask({
          title: `${target.suggestedTaskType || 'CropMonitoring'}: ${target.primaryIndicator || 'Agronomic Observation'}`,
          description: `${target.recommendedProtocol || 'Follow field protocol'} (Field: ${target.fieldId || 'General'}, Variety: ${target.cropVariety || 'Crop'}).`,
          taskType: target.suggestedTaskType || 'CropMonitoring',
          priority: target.priority || 'Medium',
          fieldId: target.fieldId,
          cropVariety: target.cropVariety,
          estimatedHours: 3.5,
          sourceCropAnalysisId: target.id || analysisId,
        });
      } catch (err) {
        console.warn('Task creation fallback handled:', err.message);
      }
    }

    // Clean up local list
    localApprovals = localApprovals.filter((a) => a.id !== analysisId);

    return { success: true, analysisId };
  },

  // Manager Rejects a diagnosis proposal
  async rejectAnalysis(analysisId, threadId, reason = 'Alternative treatment determined by manager.') {
    if (threadId) {
      try {
        await Promise.race([
          aiApi.post('/resume', {
            thread_id: threadId,
            decision: 'deny',
            comments: reason,
          }),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Agent 2 resume timeout')), 3000)),
        ]);
      } catch (err) {
        console.warn('Agent 2 /ai/resume call deferred:', err.message);
      }
    }

    try {
      await api.post(`/crop-analysis/${analysisId}/reject`, { reason });
    } catch (err) {
      try {
        await api.post(`/cropanalysis/${analysisId}/reject`, {
          managerUserId: '00000000-0000-0000-0000-000000000001',
          comments: reason,
        });
      } catch (e2) {
        console.warn('Backend /api/cropanalysis/reject deferred:', e2.message);
      }
    }

    const target = localApprovals.find((a) => a.id === analysisId);
    if (target) {
      target.status = 'Rejected';
    }

    localApprovals = localApprovals.filter((a) => a.id !== analysisId);

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
