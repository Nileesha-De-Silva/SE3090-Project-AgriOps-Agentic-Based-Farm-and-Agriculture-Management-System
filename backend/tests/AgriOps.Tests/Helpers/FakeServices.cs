using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AgriOps.Core.Entities;
using AgriOps.Core.Interfaces;

namespace AgriOps.Tests.Helpers;

public class FakeTaskService : ITaskService
{
    public List<FarmTask> Tasks { get; } = new();
    public List<TaskAssignment> Assignments { get; } = new();
    public List<TaskHistory> Histories { get; } = new();

    public Func<Guid, Task<FarmTask?>>? GetTaskByIdHandler { get; set; }
    public Func<FarmTask, Task<FarmTask>>? CreateTaskHandler { get; set; }
    public Func<Guid, Guid, Task<TaskAssignment>>? AssignWorkerHandler { get; set; }
    public Func<Guid, string, Guid, string?, Task<FarmTask>>? UpdateTaskStatusHandler { get; set; }
    public Func<Guid, string, string, Guid, Task<TaskHistory>>? SubmitTaskEvidenceHandler { get; set; }
    public Func<Guid, bool, Guid, string?, Task<FarmTask>>? VerifyTaskEvidenceHandler { get; set; }

    public Task<FarmTask?> GetTaskByIdAsync(Guid id)
    {
        if (GetTaskByIdHandler != null) return GetTaskByIdHandler(id);
        return Task.FromResult(Tasks.FirstOrDefault(t => t.Id == id));
    }

    public Task<IEnumerable<FarmTask>> GetTasksAsync(string? status = null, string? priority = null, Guid? fieldId = null, Guid? workerId = null)
    {
        var query = Tasks.AsEnumerable();
        if (!string.IsNullOrEmpty(status)) query = query.Where(t => t.Status == status);
        if (!string.IsNullOrEmpty(priority)) query = query.Where(t => t.Priority == priority);
        if (fieldId.HasValue) query = query.Where(t => t.FieldId == fieldId.Value);
        return Task.FromResult(query);
    }

    public Task<FarmTask> CreateTaskAsync(FarmTask task)
    {
        if (CreateTaskHandler != null) return CreateTaskHandler(task);
        if (task.Id == Guid.Empty) task.Id = Guid.NewGuid();
        task.CreatedAt = DateTime.UtcNow;
        task.UpdatedAt = DateTime.UtcNow;
        Tasks.Add(task);
        return Task.FromResult(task);
    }

    public Task<TaskAssignment> AssignWorkerAsync(Guid taskId, Guid workerId)
    {
        if (AssignWorkerHandler != null) return AssignWorkerHandler(taskId, workerId);

        var task = Tasks.FirstOrDefault(t => t.Id == taskId);
        if (task == null) throw new InvalidOperationException($"Task with ID '{taskId}' not found.");

        var assignment = new TaskAssignment
        {
            Id = Guid.NewGuid(),
            TaskId = taskId,
            WorkerId = workerId,
            AssignedDate = DateTime.UtcNow,
            Status = "Active",
            Worker = new Worker { Id = workerId, FullName = "Assigned Worker" }
        };
        task.Status = "Assigned";
        task.Assignments.Add(assignment);
        Assignments.Add(assignment);
        return Task.FromResult(assignment);
    }

    public Task<FarmTask> UpdateTaskStatusAsync(Guid taskId, string newStatus, Guid userId, string? remarks = null)
    {
        if (UpdateTaskStatusHandler != null) return UpdateTaskStatusHandler(taskId, newStatus, userId, remarks);

        var task = Tasks.FirstOrDefault(t => t.Id == taskId);
        if (task == null) throw new InvalidOperationException($"Task with ID '{taskId}' not found.");

        task.Status = newStatus;
        task.UpdatedAt = DateTime.UtcNow;
        return Task.FromResult(task);
    }

    public Task<TaskHistory> SubmitTaskEvidenceAsync(Guid taskId, string evidencePhotoUrl, string remarks, Guid workerUserId)
    {
        if (SubmitTaskEvidenceHandler != null) return SubmitTaskEvidenceHandler(taskId, evidencePhotoUrl, remarks, workerUserId);

        var task = Tasks.FirstOrDefault(t => t.Id == taskId);
        if (task == null) throw new InvalidOperationException($"Task with ID '{taskId}' not found.");

        task.Status = "PendingVerification";
        var history = new TaskHistory
        {
            Id = Guid.NewGuid(),
            TaskId = taskId,
            PreviousStatus = "InProgress",
            NewStatus = "PendingVerification",
            Remarks = remarks,
            EvidencePhotoUrl = evidencePhotoUrl,
            Timestamp = DateTime.UtcNow,
            ChangedByUserId = workerUserId
        };
        Histories.Add(history);
        return Task.FromResult(history);
    }

    public Task<FarmTask> VerifyTaskEvidenceAsync(Guid taskId, bool isApproved, Guid managerUserId, string? remarks = null)
    {
        if (VerifyTaskEvidenceHandler != null) return VerifyTaskEvidenceHandler(taskId, isApproved, managerUserId, remarks);

        var task = Tasks.FirstOrDefault(t => t.Id == taskId);
        if (task == null) throw new InvalidOperationException($"Task with ID '{taskId}' not found.");

        task.Status = isApproved ? "Completed" : "InProgress";
        task.UpdatedAt = DateTime.UtcNow;
        return Task.FromResult(task);
    }

    public Task<IEnumerable<TaskHistory>> GetTaskHistoryAsync(Guid taskId)
    {
        return Task.FromResult<IEnumerable<TaskHistory>>(Histories.Where(h => h.TaskId == taskId).ToList());
    }
}

public class FakeWorkerService : IWorkerService
{
    public List<Worker> Workers { get; } = new();
    public Dictionary<Guid, int> Workloads { get; } = new();
    public HashSet<(Guid WorkerId, string TaskType)> QualifiedMatrix { get; } = new();

    public Task<Worker?> GetWorkerByIdAsync(Guid id) =>
        Task.FromResult(Workers.FirstOrDefault(w => w.Id == id));

    public Task<Worker?> GetWorkerByUserIdAsync(Guid userId) =>
        Task.FromResult(Workers.FirstOrDefault(w => w.UserId == userId));

    public Task<IEnumerable<Worker>> GetAllWorkersAsync(string? status = null)
    {
        var query = Workers.AsEnumerable();
        if (!string.IsNullOrEmpty(status)) query = query.Where(w => w.Status == status);
        return Task.FromResult(query);
    }

    public Task<Worker> CreateWorkerAsync(Worker worker)
    {
        if (worker.Id == Guid.Empty) worker.Id = Guid.NewGuid();
        worker.CreatedAt = DateTime.UtcNow;
        worker.UpdatedAt = DateTime.UtcNow;
        Workers.Add(worker);
        return Task.FromResult(worker);
    }

    public Task<WorkerSkill> AddWorkerSkillAsync(Guid workerId, string skillName, string proficiencyLevel)
    {
        var skill = new WorkerSkill
        {
            Id = Guid.NewGuid(),
            WorkerId = workerId,
            SkillName = skillName,
            ProficiencyLevel = proficiencyLevel,
            CreatedAt = DateTime.UtcNow
        };
        var worker = Workers.FirstOrDefault(w => w.Id == workerId);
        worker?.Skills.Add(skill);
        return Task.FromResult(skill);
    }

    public Task<IEnumerable<WorkerSkill>> GetWorkerSkillsAsync(Guid workerId)
    {
        var worker = Workers.FirstOrDefault(w => w.Id == workerId);
        return Task.FromResult(worker?.Skills.AsEnumerable() ?? Enumerable.Empty<WorkerSkill>());
    }

    public Task<bool> IsWorkerQualifiedForTaskAsync(Guid workerId, string taskType)
    {
        if (QualifiedMatrix.Contains((workerId, taskType))) return Task.FromResult(true);

        // Fallback: check worker's skills directly
        var worker = Workers.FirstOrDefault(w => w.Id == workerId);
        if (worker == null || worker.Status != "Active") return Task.FromResult(false);

        var requiredSkill = taskType switch
        {
            "Watering" => "IrrigationSetup",
            "Fertilization" => "ChemicalHandling",
            "PestInspection" => "PestDiagnostic",
            "EquipmentMaintenance" => "HeavyMachinery",
            "Harvesting" => "CropHarvesting",
            _ => null
        };
        if (requiredSkill == null) return Task.FromResult(true);
        return Task.FromResult(worker.Skills.Any(s => s.SkillName.Equals(requiredSkill, StringComparison.OrdinalIgnoreCase)));
    }

    public Task<int> GetActiveTaskLoadCountAsync(Guid workerId)
    {
        if (Workloads.TryGetValue(workerId, out var count)) return Task.FromResult(count);
        return Task.FromResult(0);
    }
}

public class FakeCropAnalysisService : ICropAnalysisService
{
    public List<CropAnalysisAssessment> Assessments { get; } = new();

    public Task<CropAnalysisAssessment> SubmitCropAnalysisRequestAsync(Guid fieldId, string cropVariety, string growthStage, string observationText, string imageUrl, Guid submittedByUserId)
    {
        var assessment = new CropAnalysisAssessment
        {
            Id = Guid.NewGuid(),
            WorkflowId = Guid.NewGuid(),
            FieldId = fieldId,
            CropVariety = cropVariety,
            GrowthStage = growthStage,
            ObservationText = observationText,
            ImageUrl = imageUrl,
            PrimaryIndicator = "Suspected Pathogen",
            PotentialStressFactorsJson = "[]",
            RiskLevel = "Medium",
            RecommendedActionsJson = "[]",
            SuggestedTaskType = "PestInspection",
            Priority = "High",
            Status = "PendingReview",
            SubmittedByUserId = submittedByUserId,
            CreatedAt = DateTime.UtcNow
        };
        Assessments.Add(assessment);
        return Task.FromResult(assessment);
    }

    public Task<CropAnalysisAssessment?> GetAssessmentByIdAsync(Guid id) =>
        Task.FromResult(Assessments.FirstOrDefault(a => a.Id == id));

    public Task<IEnumerable<CropAnalysisAssessment>> GetPendingApprovalsAsync() =>
        Task.FromResult(Assessments.Where(a => a.Status == "PendingReview"));

    public Task<FarmTask> ApproveAssessmentAndCreateTaskAsync(Guid assessmentId, Guid managerUserId, string? comments = null)
    {
        var assessment = Assessments.FirstOrDefault(a => a.Id == assessmentId);
        if (assessment == null) throw new InvalidOperationException($"Assessment with ID '{assessmentId}' not found.");

        assessment.Status = "Approved";
        var task = new FarmTask
        {
            Id = Guid.NewGuid(),
            Title = $"Remediation: {assessment.SuggestedTaskType}",
            FieldId = assessment.FieldId,
            TaskType = assessment.SuggestedTaskType,
            Priority = assessment.Priority,
            Description = $"Remediation action for {assessment.PrimaryIndicator}. Comments: {comments}",
            TargetDate = DateTime.UtcNow.AddDays(1),
            Status = "Pending"
        };
        return Task.FromResult(task);
    }

    public Task<bool> RejectAssessmentAsync(Guid assessmentId, Guid managerUserId, string comments)
    {
        var assessment = Assessments.FirstOrDefault(a => a.Id == assessmentId);
        if (assessment == null) throw new InvalidOperationException($"Assessment with ID '{assessmentId}' not found.");

        assessment.Status = "Rejected";
        return Task.FromResult(true);
    }
}
