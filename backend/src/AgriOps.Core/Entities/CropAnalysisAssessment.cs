using System;

namespace AgriOps.Core.Entities;

public class CropAnalysisAssessment
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid WorkflowId { get; set; } = Guid.NewGuid();
    public Guid FieldId { get; set; }
    public string CropVariety { get; set; } = string.Empty;
    public string GrowthStage { get; set; } = string.Empty;
    public string ObservationText { get; set; } = string.Empty;
    public string ImageUrl { get; set; } = string.Empty;
    public string PrimaryIndicator { get; set; } = string.Empty;
    public string PotentialStressFactorsJson { get; set; } = "[]";
    public string RiskLevel { get; set; } = "Medium"; // Low, Medium, High, Critical
    public string RecommendedActionsJson { get; set; } = "[]";
    public string SuggestedTaskType { get; set; } = "PestInspection";
    public string Priority { get; set; } = "Medium";
    public string Status { get; set; } = "PendingApproval"; // PendingApproval, Approved, Rejected
    public Guid SubmittedByUserId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
