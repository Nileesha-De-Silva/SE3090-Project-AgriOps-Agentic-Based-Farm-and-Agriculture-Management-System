using System;

namespace AgriOps.Core.Entities;

public class ApprovalItem
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid WorkflowId { get; set; }
    public string ActionDescription { get; set; } = string.Empty;
    public string ProposedTaskType { get; set; } = string.Empty;
    public Guid TargetFieldId { get; set; }
    public string Status { get; set; } = "Pending"; // Pending, Approved, Rejected, Revised
    public Guid? ReviewedByUserId { get; set; }
    public string? Comments { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}
