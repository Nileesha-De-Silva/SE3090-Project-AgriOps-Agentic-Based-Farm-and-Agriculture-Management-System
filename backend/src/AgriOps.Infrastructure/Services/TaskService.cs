using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using AgriOps.Core.Entities;
using AgriOps.Core.Interfaces;
using AgriOps.Infrastructure.Data;

namespace AgriOps.Infrastructure.Services;

public class TaskService : ITaskService
{
    private readonly ApplicationDbContext _dbContext;

    public TaskService(ApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<FarmTask?> GetTaskByIdAsync(Guid id)
    {
        return await _dbContext.Tasks
            .Include(t => t.Assignments)
                .ThenInclude(a => a.Worker)
            .Include(t => t.Histories)
            .Include(t => t.Schedule)
            .AsNoTracking()
            .FirstOrDefaultAsync(t => t.Id == id);
    }

    public async Task<IEnumerable<FarmTask>> GetTasksAsync(string? status = null, string? priority = null, Guid? fieldId = null, Guid? workerId = null)
    {
        var query = _dbContext.Tasks
            .Include(t => t.Assignments)
                .ThenInclude(a => a.Worker)
            .Include(t => t.Schedule)
            .AsNoTracking()
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(status))
        {
            query = query.Where(t => t.Status == status);
        }

        if (!string.IsNullOrWhiteSpace(priority))
        {
            query = query.Where(t => t.Priority == priority);
        }

        if (fieldId.HasValue)
        {
            query = query.Where(t => t.FieldId == fieldId.Value);
        }

        if (workerId.HasValue)
        {
            query = query.Where(t => t.Assignments.Any(a => a.WorkerId == workerId.Value && a.Status == "Active"));
        }

        return await query.OrderByDescending(t => t.CreatedAt).ToListAsync();
    }

    public async Task<FarmTask> CreateTaskAsync(FarmTask task)
    {
        if (task.Id == Guid.Empty)
        {
            task.Id = Guid.NewGuid();
        }

        task.CreatedAt = DateTime.UtcNow;
        task.UpdatedAt = DateTime.UtcNow;

        var history = new TaskHistory
        {
            Id = Guid.NewGuid(),
            TaskId = task.Id,
            PreviousStatus = "None",
            NewStatus = task.Status,
            ChangedByUserId = Guid.Empty,
            Remarks = "Task manually created",
            Timestamp = DateTime.UtcNow
        };

        _dbContext.Tasks.Add(task);
        _dbContext.TaskHistories.Add(history);
        await _dbContext.SaveChangesAsync();

        return task;
    }

    public async Task<TaskAssignment> AssignWorkerAsync(Guid taskId, Guid workerId)
    {
        var task = await _dbContext.Tasks
            .Include(t => t.Assignments)
            .FirstOrDefaultAsync(t => t.Id == taskId);

        if (task == null)
        {
            throw new InvalidOperationException($"Task with ID '{taskId}' not found.");
        }

        var worker = await _dbContext.Workers.FirstOrDefaultAsync(w => w.Id == workerId);
        if (worker == null)
        {
            throw new InvalidOperationException($"Worker with ID '{workerId}' not found.");
        }

        // Release existing active assignments if any
        foreach (var existing in task.Assignments.Where(a => a.Status == "Active"))
        {
            existing.Status = "Reassigned";
        }

        var assignment = new TaskAssignment
        {
            Id = Guid.NewGuid(),
            TaskId = taskId,
            WorkerId = workerId,
            AssignedDate = DateTime.UtcNow,
            Status = "Active"
        };

        task.Status = "Assigned";
        task.UpdatedAt = DateTime.UtcNow;

        var history = new TaskHistory
        {
            Id = Guid.NewGuid(),
            TaskId = taskId,
            PreviousStatus = task.Status,
            NewStatus = "Assigned",
            ChangedByUserId = Guid.Empty,
            Remarks = $"Assigned worker {worker.FullName} (ID: {workerId})",
            Timestamp = DateTime.UtcNow
        };

        _dbContext.TaskAssignments.Add(assignment);
        _dbContext.TaskHistories.Add(history);
        await _dbContext.SaveChangesAsync();

        return assignment;
    }

    public async Task<FarmTask> UpdateTaskStatusAsync(Guid taskId, string newStatus, Guid userId, string? remarks = null)
    {
        var task = await _dbContext.Tasks.FirstOrDefaultAsync(t => t.Id == taskId);
        if (task == null)
        {
            throw new InvalidOperationException($"Task with ID '{taskId}' not found.");
        }

        var previousStatus = task.Status;
        task.Status = newStatus;
        task.UpdatedAt = DateTime.UtcNow;

        var history = new TaskHistory
        {
            Id = Guid.NewGuid(),
            TaskId = taskId,
            PreviousStatus = previousStatus,
            NewStatus = newStatus,
            ChangedByUserId = userId,
            Remarks = remarks ?? $"Status updated to {newStatus}",
            Timestamp = DateTime.UtcNow
        };

        _dbContext.TaskHistories.Add(history);
        await _dbContext.SaveChangesAsync();

        return task;
    }

    public async Task<TaskHistory> SubmitTaskEvidenceAsync(Guid taskId, string evidencePhotoUrl, string remarks, Guid workerUserId)
    {
        var task = await _dbContext.Tasks.FirstOrDefaultAsync(t => t.Id == taskId);
        if (task == null)
        {
            throw new InvalidOperationException($"Task with ID '{taskId}' not found.");
        }

        var previousStatus = task.Status;
        task.Status = "PendingVerification";
        task.UpdatedAt = DateTime.UtcNow;

        var history = new TaskHistory
        {
            Id = Guid.NewGuid(),
            TaskId = taskId,
            PreviousStatus = previousStatus,
            NewStatus = "PendingVerification",
            ChangedByUserId = workerUserId,
            Remarks = remarks,
            EvidencePhotoUrl = evidencePhotoUrl,
            Timestamp = DateTime.UtcNow
        };

        _dbContext.TaskHistories.Add(history);
        await _dbContext.SaveChangesAsync();

        return history;
    }

    public async Task<FarmTask> VerifyTaskEvidenceAsync(Guid taskId, bool isApproved, Guid managerUserId, string? remarks = null)
    {
        var task = await _dbContext.Tasks.FirstOrDefaultAsync(t => t.Id == taskId);
        if (task == null)
        {
            throw new InvalidOperationException($"Task with ID '{taskId}' not found.");
        }

        var previousStatus = task.Status;
        var newStatus = isApproved ? "Completed" : "InProgress";
        task.Status = newStatus;
        task.UpdatedAt = DateTime.UtcNow;

        var history = new TaskHistory
        {
            Id = Guid.NewGuid(),
            TaskId = taskId,
            PreviousStatus = previousStatus,
            NewStatus = newStatus,
            ChangedByUserId = managerUserId,
            Remarks = remarks ?? (isApproved ? "Evidence verified and task completed." : "Evidence rejected, task returned to InProgress."),
            Timestamp = DateTime.UtcNow
        };

        _dbContext.TaskHistories.Add(history);
        await _dbContext.SaveChangesAsync();

        return task;
    }

    public async Task<IEnumerable<TaskHistory>> GetTaskHistoryAsync(Guid taskId)
    {
        return await _dbContext.TaskHistories
            .AsNoTracking()
            .Where(h => h.TaskId == taskId)
            .OrderByDescending(h => h.Timestamp)
            .ToListAsync();
    }
}
