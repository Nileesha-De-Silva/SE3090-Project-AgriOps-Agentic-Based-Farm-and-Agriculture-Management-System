using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using AgriOps.Core.Entities;

namespace AgriOps.Core.Interfaces;

public interface IWorkerService
{
    Task<Worker?> GetWorkerByIdAsync(Guid id);
    Task<Worker?> GetWorkerByUserIdAsync(Guid userId);
    Task<IEnumerable<Worker>> GetAllWorkersAsync(string? status = null);
    Task<Worker> CreateWorkerAsync(Worker worker);
    Task<WorkerSkill> AddWorkerSkillAsync(Guid workerId, string skillName, string proficiencyLevel);
    Task<IEnumerable<WorkerSkill>> GetWorkerSkillsAsync(Guid workerId);
    Task<bool> IsWorkerQualifiedForTaskAsync(Guid workerId, string taskType);
    Task<int> GetActiveTaskLoadCountAsync(Guid workerId);
}
