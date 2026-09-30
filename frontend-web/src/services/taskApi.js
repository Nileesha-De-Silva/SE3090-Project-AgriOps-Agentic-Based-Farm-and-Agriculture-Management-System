import { api, INITIAL_MOCK_TASKS } from './apiClient';

const GUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function toValidGuidOrNull(val) {
  if (!val || typeof val !== 'string') return null;
  return GUID_REGEX.test(val.trim()) ? val.trim() : null;
}

function normalizeTask(dto) {
  if (!dto) return null;
  const firstAssignment = dto.assignments && dto.assignments.length > 0 ? dto.assignments[0] : null;
  return {
    id: dto.id,
    title: dto.title || dto.description?.split('\n')[0] || dto.taskType || 'Farm Operation',
    description: dto.description || '',
    taskType: dto.taskType || 'CropMonitoring',
    priority: dto.priority || 'Medium',
    status: dto.status || 'Pending',
    fieldId: dto.fieldId || '',
    cropSeasonId: dto.cropSeasonId || null,
    dueDate: dto.targetDate || dto.dueDate || new Date(Date.now() + 86400000).toISOString(),
    targetDate: dto.targetDate || dto.dueDate || new Date(Date.now() + 86400000).toISOString(),
    assignedWorkerId: firstAssignment ? firstAssignment.workerId : (dto.assignedWorkerId || null),
    assignedWorkerName: firstAssignment ? (firstAssignment.workerName || 'Assigned Worker') : (dto.assignedWorkerName || null),
    assignments: dto.assignments || [],
    schedule: dto.schedule || null,
    cropVariety: dto.cropVariety || '',
    estimatedHours: dto.estimatedHours || 2.0,
    sourceCropAnalysisId: dto.sourceCropAnalysisId || null,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
  };
}

// In-memory client cache for smooth optimistic UI & offline fallback
let localTasks = [...INITIAL_MOCK_TASKS];

export const taskApi = {
  // Fetch all tasks
  async getAllTasks() {
    try {
      const response = await api.get('/tasks');
      if (response.data && Array.isArray(response.data)) {
        localTasks = response.data.map(normalizeTask);
        return localTasks;
      }
    } catch (err) {
      console.warn('Backend /api/tasks unavailable, using local state:', err.message);
    }
    return localTasks;
  },

  // Fetch task by ID
  async getTaskById(taskId) {
    try {
      const response = await api.get(`/tasks/${taskId}`);
      return normalizeTask(response.data);
    } catch (err) {
      const found = localTasks.find((t) => t.id === taskId);
      if (found) return found;
      throw err;
    }
  },

  // Create new task
  async createTask(taskData) {
    const payload = {
      title: taskData.title?.trim() || 'Farm Operation',
      fieldId: toValidGuidOrNull(taskData.fieldId),
      cropSeasonId: toValidGuidOrNull(taskData.cropSeasonId),
      taskType: taskData.taskType || 'CropMonitoring',
      priority: taskData.priority || 'Medium',
      description: taskData.description || taskData.title || '',
      targetDate: taskData.dueDate
        ? new Date(taskData.dueDate).toISOString()
        : (taskData.targetDate ? new Date(taskData.targetDate).toISOString() : new Date(Date.now() + 86400000).toISOString()),
    };

    try {
      const response = await api.post('/tasks', payload);
      if (response.data) {
        const savedTask = normalizeTask(response.data);
        localTasks.unshift(savedTask);
        return savedTask;
      }
    } catch (err) {
      console.error('Backend /api/tasks POST failed:', err.response?.data || err.message);
      throw err;
    }

    const fallbackTask = normalizeTask({
      id: `tsk-${Date.now().toString().slice(-4)}`,
      ...payload,
      status: 'Pending',
    });
    localTasks.unshift(fallbackTask);
    return fallbackTask;
  },

  // Assign worker to task
  async assignWorker(taskId, workerId, workerName) {
    try {
      await api.post(`/tasks/${taskId}/assign`, { workerId });
    } catch (err) {
      console.warn('Backend /api/tasks assign unavailable, updating locally:', err.message);
    }

    localTasks = localTasks.map((t) =>
      t.id === taskId
        ? {
            ...t,
            assignedWorkerId: workerId,
            assignedWorkerName: workerName,
            status: t.status === 'Pending' ? 'Assigned' : t.status,
          }
        : t
    );
    return localTasks.find((t) => t.id === taskId);
  },

  // Update task status (e.g. dragging across Kanban)
  async updateStatus(taskId, newStatus) {
    try {
      await api.patch(`/tasks/${taskId}/status`, {
        newStatus,
        userId: '00000000-0000-0000-0000-000000000000',
        remarks: `Status updated to ${newStatus}`,
      });
    } catch (err) {
      console.warn('Backend /api/tasks status unavailable, updating locally:', err.message);
    }

    localTasks = localTasks.map((t) =>
      t.id === taskId ? { ...t, status: newStatus } : t
    );
    return localTasks.find((t) => t.id === taskId);
  },

  // Verify task evidence (Human verification gate)
  async verifyTask(taskId, isApproved, feedback = '') {
    try {
      await api.post(`/tasks/${taskId}/verify`, {
        isApproved,
        managerUserId: '00000000-0000-0000-0000-000000000000',
        remarks: feedback,
      });
    } catch (err) {
      console.warn('Backend /api/tasks verify unavailable, updating locally:', err.message);
    }

    localTasks = localTasks.map((t) =>
      t.id === taskId
        ? {
            ...t,
            status: isApproved ? 'Completed' : 'InProgress',
            verificationFeedback: feedback,
            verifiedAt: isApproved ? new Date().toISOString() : null,
          }
        : t
    );
    return localTasks.find((t) => t.id === taskId);
  },
};
