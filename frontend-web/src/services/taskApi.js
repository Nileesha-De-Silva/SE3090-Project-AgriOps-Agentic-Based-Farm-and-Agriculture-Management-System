import { api, INITIAL_MOCK_TASKS } from './apiClient';

// In-memory client cache for smooth optimistic UI & offline fallback
let localTasks = [...INITIAL_MOCK_TASKS];

export const taskApi = {
  // Fetch all tasks
  async getAllTasks() {
    try {
      const response = await api.get('/tasks');
      if (response.data && Array.isArray(response.data)) {
        localTasks = response.data;
        return response.data;
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
      return response.data;
    } catch (err) {
      const found = localTasks.find((t) => t.id === taskId);
      if (found) return found;
      throw err;
    }
  },

  // Create new task
  async createTask(taskData) {
    const newTask = {
      id: `tsk-${Date.now().toString().slice(-4)}`,
      title: taskData.title,
      description: taskData.description || '',
      taskType: taskData.taskType || 'CropMonitoring',
      priority: taskData.priority || 'Medium',
      status: 'Pending',
      fieldId: taskData.fieldId || 'field-north-1',
      assignedWorkerId: null,
      assignedWorkerName: null,
      dueDate: taskData.dueDate || new Date(Date.now() + 86400000).toISOString(),
      cropVariety: taskData.cropVariety || 'Tomato',
      estimatedHours: Number(taskData.estimatedHours) || 2.0,
      sourceCropAnalysisId: taskData.sourceCropAnalysisId || null,
    };

    try {
      const response = await api.post('/tasks', newTask);
      if (response.data) {
        localTasks.unshift(response.data);
        return response.data;
      }
    } catch (err) {
      console.warn('Backend /api/tasks POST unavailable, persisting locally:', err.message);
    }
    localTasks.unshift(newTask);
    return newTask;
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
      await api.post(`/tasks/${taskId}/status`, { status: newStatus });
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
        verified: isApproved,
        feedback,
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
