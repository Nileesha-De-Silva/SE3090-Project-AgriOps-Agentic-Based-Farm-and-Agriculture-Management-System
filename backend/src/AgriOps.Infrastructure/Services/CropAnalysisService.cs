using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using AgriOps.Core.Entities;
using AgriOps.Core.Interfaces;
using AgriOps.Infrastructure.Data;

namespace AgriOps.Infrastructure.Services;

public class CropAnalysisService : ICropAnalysisService
{
    private readonly ApplicationDbContext _dbContext;

    public CropAnalysisService(ApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<CropAnalysisAssessment> SubmitCropAnalysisRequestAsync(
        Guid fieldId,
        string cropVariety,
        string growthStage,
        string observationText,
        string imageUrl,
        Guid submittedByUserId)
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
            PrimaryIndicator = "Pest/Disease Sign Detected",
            PotentialStressFactorsJson = "[\"Fungal Infection\", \"Nutrient Deficiency\"]",
            RiskLevel = "Medium",
            RecommendedActionsJson = "[\"Targeted Spraying\", \"Follow-up Inspection in 48h\"]",
            SuggestedTaskType = "PestInspection",
            Priority = "Medium",
            Status = "PendingApproval",
            SubmittedByUserId = submittedByUserId,
            CreatedAt = DateTime.UtcNow
        };

        var approvalItem = new ApprovalItem
        {
            Id = Guid.NewGuid(),
            WorkflowId = assessment.WorkflowId,
            ActionDescription = $"Crop Analysis for {cropVariety} on Field {fieldId}: Suggested {assessment.SuggestedTaskType}",
            ProposedTaskType = assessment.SuggestedTaskType,
            TargetFieldId = fieldId,
            Status = "Pending",
            CreatedAt = DateTime.UtcNow
        };

        _dbContext.CropAnalysisAssessments.Add(assessment);
        _dbContext.ApprovalItems.Add(approvalItem);
        await _dbContext.SaveChangesAsync();

        return assessment;
    }

    public async Task<CropAnalysisAssessment?> GetAssessmentByIdAsync(Guid id)
    {
        return await _dbContext.CropAnalysisAssessments
            .AsNoTracking()
            .FirstOrDefaultAsync(a => a.Id == id);
    }

    public async Task<IEnumerable<CropAnalysisAssessment>> GetPendingApprovalsAsync()
    {
        return await _dbContext.CropAnalysisAssessments
            .AsNoTracking()
            .Where(a => a.Status == "PendingApproval")
            .OrderByDescending(a => a.CreatedAt)
            .ToListAsync();
    }

    public async Task<FarmTask> ApproveAssessmentAndCreateTaskAsync(Guid assessmentId, Guid managerUserId, string? comments = null)
    {
        var assessment = await _dbContext.CropAnalysisAssessments.FirstOrDefaultAsync(a => a.Id == assessmentId);
        if (assessment == null)
        {
            throw new InvalidOperationException($"Crop analysis assessment with ID '{assessmentId}' not found.");
        }

        assessment.Status = "Approved";

        var approvalItem = await _dbContext.ApprovalItems.FirstOrDefaultAsync(i => i.WorkflowId == assessment.WorkflowId);
        if (approvalItem != null)
        {
            approvalItem.Status = "Approved";
            approvalItem.ReviewedByUserId = managerUserId;
            approvalItem.Comments = comments;
            approvalItem.UpdatedAt = DateTime.UtcNow;
        }

        var task = new FarmTask
        {
            Id = Guid.NewGuid(),
            FieldId = assessment.FieldId,
            CropSeasonId = Guid.Empty, // Default unassigned season
            TaskType = assessment.SuggestedTaskType,
            Priority = assessment.Priority,
            Description = $"[AI Generated] {assessment.ObservationText}. Manager note: {comments ?? "Approved without additional comments."}",
            TargetDate = DateTime.UtcNow.AddDays(1),
            Status = "Pending",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var taskHistory = new TaskHistory
        {
            Id = Guid.NewGuid(),
            TaskId = task.Id,
            PreviousStatus = "None",
            NewStatus = "Pending",
            ChangedByUserId = managerUserId,
            Remarks = $"Created via approved AI Crop Analysis Assessment ({assessmentId})",
            Timestamp = DateTime.UtcNow
        };

        _dbContext.Tasks.Add(task);
        _dbContext.TaskHistories.Add(taskHistory);
        await _dbContext.SaveChangesAsync();

        return task;
    }

    public async Task<bool> RejectAssessmentAsync(Guid assessmentId, Guid managerUserId, string comments)
    {
        var assessment = await _dbContext.CropAnalysisAssessments.FirstOrDefaultAsync(a => a.Id == assessmentId);
        if (assessment == null)
        {
            return false;
        }

        assessment.Status = "Rejected";

        var approvalItem = await _dbContext.ApprovalItems.FirstOrDefaultAsync(i => i.WorkflowId == assessment.WorkflowId);
        if (approvalItem != null)
        {
            approvalItem.Status = "Rejected";
            approvalItem.ReviewedByUserId = managerUserId;
            approvalItem.Comments = comments;
            approvalItem.UpdatedAt = DateTime.UtcNow;
        }

        await _dbContext.SaveChangesAsync();
        return true;
    }
}
