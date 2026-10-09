import { describe, it, expect, vi, beforeEach } from 'vitest';
import { taskApi } from '../../services/taskApi';
import { api } from '../../services/apiClient';

vi.mock('../../services/apiClient', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    put: vi.fn(),
  },
  INITIAL_MOCK_TASKS: [
    {
      id: 'task-101',
      title: 'Weeding Bed A',
      status: 'Pending',
      priority: 'Low',
    },
  ],
}));

describe('Task API Service (Component 2)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getAllTasks fetches tasks from /tasks endpoint', async () => {
    const mockTasks = [
      {
        id: 'b6f6f966-512a-43c2-a9b1-5ecad48e3a21',
        title: 'Check Moisture Sensor',
        taskType: 'CropMonitoring',
        priority: 'Medium',
        status: 'Pending',
      },
    ];

    api.get.mockResolvedValue({ data: mockTasks });

    const tasks = await taskApi.getAllTasks();
    expect(tasks).toHaveLength(1);
    expect(tasks[0].title).toBe('Check Moisture Sensor');
    expect(api.get).toHaveBeenCalledWith('/tasks');
  });

  it('createTask posts validated payload to /tasks', async () => {
    const newTask = {
      title: 'Harvest Field 3 Tomatoes',
      taskType: 'Harvesting',
      priority: 'High',
      estimatedHours: 4.0,
    };

    api.post.mockResolvedValue({
      data: { id: 'task-new-id', ...newTask },
    });

    const result = await taskApi.createTask(newTask);
    expect(result.title).toBe('Harvest Field 3 Tomatoes');
    expect(api.post).toHaveBeenCalledWith('/tasks', expect.any(Object));
  });

  it('updateStatus patches task status', async () => {
    // First load task into memory
    api.get.mockResolvedValue({
      data: [{ id: 'task-101', title: 'Weeding Bed A', status: 'Pending' }],
    });
    await taskApi.getAllTasks();

    api.patch.mockResolvedValue({
      data: { id: 'task-101', status: 'Completed' },
    });

    const result = await taskApi.updateStatus('task-101', 'Completed');
    expect(result).toBeDefined();
    expect(result.status).toBe('Completed');
    expect(api.patch).toHaveBeenCalledWith(
      '/tasks/task-101/status',
      expect.objectContaining({ newStatus: 'Completed' })
    );
  });

  it('getTaskById fetches a single task by its identifier', async () => {
    const singleTask = {
      id: 'task-single-01',
      title: 'Calibrate Soil pH Meters',
      taskType: 'SoilTesting',
      priority: 'Medium',
      status: 'Pending',
    };
    api.get.mockResolvedValue({ data: singleTask });

    const result = await taskApi.getTaskById('task-single-01');
    expect(result.id).toBe('task-single-01');
    expect(result.title).toBe('Calibrate Soil pH Meters');
    expect(api.get).toHaveBeenCalledWith('/tasks/task-single-01');
  });

  it('assignWorker posts assignment to /tasks/{id}/assign endpoint', async () => {
    api.post.mockResolvedValue({ data: { success: true } });

    const result = await taskApi.assignWorker('task-101', 'w-10', 'Kasun Bandara');
    expect(api.post).toHaveBeenCalledWith(
      '/tasks/task-101/assign',
      { workerId: 'w-10' }
    );
    expect(result.assignedWorkerId).toBe('w-10');
    expect(result.assignedWorkerName).toBe('Kasun Bandara');
  });

  it('verifyTask posts verification outcome to /tasks/{id}/verify endpoint', async () => {
    api.post.mockResolvedValue({ data: { success: true } });

    const result = await taskApi.verifyTask('task-101', true, 'Verified and approved.');
    expect(api.post).toHaveBeenCalledWith(
      '/tasks/task-101/verify',
      expect.objectContaining({
        isApproved: true,
        remarks: 'Verified and approved.',
      })
    );
    expect(result.status).toBe('Completed');
    expect(result.verificationFeedback).toBe('Verified and approved.');
  });
});
