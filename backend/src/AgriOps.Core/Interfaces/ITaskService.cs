using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using AgriOps.Core.Entities;

namespace AgriOps.Core.Interfaces;

public interface ITaskService
{
    Task<FarmTask?> GetTaskByIdAsync(Guid id);
    Task<IEnumerable<FarmTask>> GetTasksAsync(string? status = null, string? priority = null, Guid? fieldId = null, Guid? workerId = null);
    Task<FarmTask> CreateTaskAsync(FarmTask task);
    Task<TaskAssignment> AssignWorkerAsync(Guid taskId, Guid workerId);
    Task<FarmTask> UpdateTaskStatusAsync(Guid taskId, string newStatus, Guid userId, string? remarks = null);
    Task<TaskHistory> SubmitTaskEvidenceAsync(Guid taskId, string evidencePhotoUrl, string remarks, Guid workerUserId);
    Task<FarmTask> VerifyTaskEvidenceAsync(Guid taskId, bool isApproved, Guid managerUserId, string? remarks = null);
    Task<IEnumerable<TaskHistory>> GetTaskHistoryAsync(Guid taskId);
}
