import { describe, it, expect, vi, beforeEach } from 'vitest';
import { workerApi } from '../../services/workerApi';
import { api } from '../../services/apiClient';

vi.mock('../../services/apiClient', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
  },
  INITIAL_MOCK_WORKERS: [
    {
      id: 'worker-initial-1',
      name: 'Sunil Silva',
      role: 'Irrigation Specialist',
      isAvailable: true,
      skills: ['IrrigationManagement', 'SoilTesting'],
      activeTasksCount: 0,
    },
  ],
}));

describe('Worker API Service & Match Algorithm (Component 2)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getAllWorkers fetches workers from backend /workers endpoint', async () => {
    const mockList = [
      { id: 'w-1', name: 'Nileesha Worker', isAvailable: true, skills: ['CropScouting'] },
    ];
    api.get.mockResolvedValue({ data: mockList });

    const workers = await workerApi.getAllWorkers();
    expect(workers).toHaveLength(1);
    expect(workers[0].name).toBe('Nileesha Worker');
    expect(api.get).toHaveBeenCalledWith('/workers');
  });

  it('getAvailableWorkers returns only available workforce', async () => {
    const mockAvailable = [
      { id: 'w-2', name: 'Available Worker', isAvailable: true },
    ];
    api.get.mockResolvedValue({ data: mockAvailable });

    const available = await workerApi.getAvailableWorkers();
    expect(available).toHaveLength(1);
    expect(available[0].name).toBe('Available Worker');
    expect(api.get).toHaveBeenCalledWith('/workers/available');
  });

  describe('calculateMatchScore Algorithmic Dispatch Engine', () => {
    it('returns 0 match score if worker is not available', () => {
      const busyWorker = {
        id: 'w-busy',
        name: 'Busy Worker',
        isAvailable: false,
        skills: ['PesticideCertified', 'SprayingOperator', 'SafetyHandling'],
        activeTasksCount: 3,
      };

      const score = workerApi.calculateMatchScore(busyWorker, 'PesticideApplication');
      expect(score).toBe(0);
    });

    it('awards 20 points per matched qualification', () => {
      const qualifiedWorker = {
        id: 'w-qual',
        name: 'Certified Applicator',
        isAvailable: true,
        skills: ['PesticideCertified', 'SprayingOperator', 'SafetyHandling'],
        activeTasksCount: 0,
      };

      // Base 50 + (3 * 20) = 110 -> clamped to 100 max
      const score = workerApi.calculateMatchScore(qualifiedWorker, 'PesticideApplication');
      expect(score).toBe(100);
    });

    it('penalizes high active task load by 10 points per task', () => {
      const overloadedWorker = {
        id: 'w-over',
        name: 'Overloaded Worker',
        isAvailable: true,
        skills: ['IrrigationManagement'], // +20
        activeTasksCount: 4, // -40
      };

      // Base 50 + 20 - 40 = 30
      const score = workerApi.calculateMatchScore(overloadedWorker, 'Irrigation');
      expect(score).toBe(30);
    });

    it('clamps lowest score to minimum of 10 points for available workers', () => {
      const unqualifiedWorker = {
        id: 'w-none',
        name: 'New Apprentice',
        isAvailable: true,
        skills: [],
        activeTasksCount: 8, // -80 penalty
      };

      // Base 50 - 80 = -30 -> clamped to 10
      const score = workerApi.calculateMatchScore(unqualifiedWorker, 'PesticideApplication');
      expect(score).toBe(10);
    });
  });
});
