using System;

namespace AgriOps.Core.Entities;

public class ValidationResult
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string ProposalId { get; set; } = string.Empty;
    public string GeneratingAgent { get; set; } = string.Empty; // "Agent1_FarmPlanner", "Agent2_CropAnalysis", "Agent3_Inventory"
    public Guid? TargetFieldId { get; set; }
    public string CropVariety { get; set; } = string.Empty;
    public string ProposedAction { get; set; } = string.Empty;
    public decimal ProposedQuantity { get; set; }
    public string UnitOfMeasurement { get; set; } = string.Empty;
    public bool IsValid { get; set; }
    public string Decision { get; set; } = "VALID"; // "VALID", "INVALID", "REVISION_REQUESTED"
    public string CheckResultsJson { get; set; } = "[]"; // 6 deterministic checks + weather check
    public string WeatherSnapshotJson { get; set; } = "{}"; // Temperature, rain prob, wind speed, humidity, forecast
    public string FailureReasonsJson { get; set; } = "[]";
    public string? RevisionGuidance { get; set; }
    public bool RequiresHumanApproval { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Field? TargetField { get; set; }
}
