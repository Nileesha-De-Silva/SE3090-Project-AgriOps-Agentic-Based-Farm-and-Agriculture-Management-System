using System;

namespace AgriOps.Core.Entities;

public class TaskSchedule
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid TaskId { get; set; }
    public string Frequency { get; set; } = "Daily"; // Daily, Weekly, BiWeekly, Monthly
    public DateTime StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public DateTime NextExecutionDate { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation Property
    public FarmTask? Task { get; set; }
}
