import { api, INITIAL_MOCK_WORKERS } from './apiClient';

function normalizeWorker(dto) {
  if (!dto) return null;
  // Convert skills into array of strings if they are objects
  const skillNames = (dto.skills || [])
    .map((s) => (typeof s === 'string' ? s : s.skillName || s.name || ''))
    .filter(Boolean);

  const activeCount = dto.activeWorkloadCount ?? dto.activeTasksCount ?? 0;
  const isAvailable =
    dto.status !== undefined
      ? dto.status === 'Active' && activeCount < 5
      : (dto.isAvailable ?? true);

  return {
    id: dto.id,
    userId: dto.userId,
    name: dto.fullName || dto.name || 'Field Worker',
    fullName: dto.fullName || dto.name || 'Field Worker',
    role: dto.employmentType || dto.role || 'Field Operations Specialist',
    employmentType: dto.employmentType || 'FullTime',
    contactNumber: dto.contactNumber || '+94 77 000 0000',
    status: dto.status || 'Active',
    isAvailable,
    activeTasksCount: activeCount,
    activeWorkloadCount: activeCount,
    skills: skillNames,
    skillsRaw: dto.skills || [],
    hourlyRate: dto.hourlyRate || 22,
    createdAt: dto.createdAt,
  };
}

let localWorkers = INITIAL_MOCK_WORKERS.map(normalizeWorker);

export const workerApi = {
  async getAllWorkers() {
    try {
      const response = await api.get('/workers');
      if (response.data && Array.isArray(response.data)) {
        localWorkers = response.data.map(normalizeWorker);
        return localWorkers;
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
        return response.data.map(normalizeWorker);
      }
    } catch (err) {
      console.warn('Backend /api/workers/available unavailable, filtering local:', err.message);
    }
    return localWorkers.filter((w) => w.isAvailable);
  },

  // Calculate skill matching score for task assignment
  calculateMatchScore(worker, taskType) {
    let score = 60; // base score
    const isAvail = worker.isAvailable !== undefined ? worker.isAvailable : worker.status === 'Active';
    if (!isAvail) return 0;

    const taskRequirements = {
      Fertilization: ['Fertilization', 'ChemicalHandling', 'SoilTesting'],
      PesticideApplication: ['PesticideCertified', 'SprayingOperator', 'ChemicalHandling', 'SafetyHandling'],
      PestInspection: ['PestDiagnostic', 'CropScouting', 'FungicideSpecialist', 'PesticideCertified'],
      CropMonitoring: ['CropScouting', 'SoilTesting', 'PestDiagnostic'],
      Irrigation: ['Irrigation', 'IrrigationManagement', 'SoilTesting'],
      Harvesting: ['Harvesting', 'QualityGrading', 'GeneralLabor'],
      Planting: ['Planting', 'GeneralLabor'],
      Pruning: ['Pruning', 'GreenhouseOperations', 'GeneralLabor'],
      Weeding: ['GeneralLabor', 'Planting'],
    };

    const requiredSkills = taskRequirements[taskType] || ['GeneralLabor'];
    const workerSkillNames = (worker.skills || []).map((s) =>
      (typeof s === 'string' ? s : s.skillName || '').toLowerCase()
    );

    const matchedCount = workerSkillNames.filter((s) =>
      requiredSkills.some((req) => s.includes(req.toLowerCase()) || req.toLowerCase().includes(s))
    ).length;

    score += matchedCount * 20;
    const taskCount = Number(worker.activeTasksCount || worker.activeWorkloadCount || 0);
    score -= taskCount * 10;
    return Math.max(20, Math.min(100, Math.round(score)));
  },
};
