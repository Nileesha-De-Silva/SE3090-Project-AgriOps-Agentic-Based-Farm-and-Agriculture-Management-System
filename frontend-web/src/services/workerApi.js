import { api, INITIAL_MOCK_WORKERS } from './apiClient';

let localWorkers = [...INITIAL_MOCK_WORKERS];

export const workerApi = {
  async getAllWorkers() {
    try {
      const response = await api.get('/workers');
      if (response.data && Array.isArray(response.data)) {
        localWorkers = response.data;
        return response.data;
      }
    } catch (err) {
      console.warn('Backend /api/workers unavailable, using local worker pool:', err.message);
    }
    return localWorkers;
  },

  async getAvailableWorkers() {
    try {
      const response = await api.get('/workers/available');
      if (response.data && Array.isArray(response.data)) {
        return response.data;
      }
    } catch (err) {
      console.warn('Backend /api/workers/available unavailable, filtering local:', err.message);
    }
    return localWorkers.filter((w) => w.isAvailable);
  },

  // Calculate skill matching score for task assignment
  calculateMatchScore(worker, taskType) {
    let score = 50; // base score
    if (!worker.isAvailable) return 0;

    const taskRequirements = {
      PesticideApplication: ['PesticideCertified', 'SprayingOperator', 'SafetyHandling'],
      PestInspection: ['CropScouting', 'FungicideSpecialist', 'PesticideCertified'],
      CropMonitoring: ['CropScouting', 'SoilTesting'],
      Irrigation: ['IrrigationManagement', 'SoilTesting'],
      Harvesting: ['Harvesting', 'QualityGrading'],
      Pruning: ['Pruning', 'GreenhouseOperations'],
    };

    const requiredSkills = taskRequirements[taskType] || [];
    const matchedCount = worker.skills.filter((s) => requiredSkills.includes(s)).length;

    score += matchedCount * 20;
    score -= worker.activeTasksCount * 10; // penalty for high task load
    return Math.max(10, Math.min(100, score));
  },
};
