using System;
using System.Collections.Generic;

namespace AgriOps.Core.Entities;

public class FarmTask
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid FieldId { get; set; } // FK to Component 1 Field
    public Guid CropSeasonId { get; set; } // FK to Component 1 CropSeason
    public string TaskType { get; set; } = string.Empty; // Watering, Fertilization, Weeding, PestInspection, CropMonitoring, Harvesting, EquipmentMaintenance
    public string Priority { get; set; } = "Medium"; // Low, Medium, High, Critical
    public string Description { get; set; } = string.Empty;
    public DateTime TargetDate { get; set; }
    public string Status { get; set; } = "Pending"; // Pending, Assigned, InProgress, PendingVerification, Completed, Cancelled
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation Properties
    public ICollection<TaskAssignment> Assignments { get; set; } = new List<TaskAssignment>();
    public ICollection<TaskHistory> Histories { get; set; } = new List<TaskHistory>();
    public TaskSchedule? Schedule { get; set; }
}
