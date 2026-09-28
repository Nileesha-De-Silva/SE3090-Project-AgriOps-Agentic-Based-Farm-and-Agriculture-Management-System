using System;

namespace AgriOps.Core.Entities;

public class TaskHistory
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid TaskId { get; set; }
    public string PreviousStatus { get; set; } = string.Empty;
    public string NewStatus { get; set; } = string.Empty;
    public Guid ChangedByUserId { get; set; }
    public string? Remarks { get; set; }
    public string? EvidencePhotoUrl { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;

    // Navigation Property
    public FarmTask? Task { get; set; }
}
