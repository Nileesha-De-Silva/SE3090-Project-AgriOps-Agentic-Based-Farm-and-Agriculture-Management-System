using System;
using System.Collections.Generic;

namespace AgriOps.Core.Entities;

public class Worker
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string ContactNumber { get; set; } = string.Empty;
    public string EmploymentType { get; set; } = "FullTime"; // FullTime, PartTime, Seasonal, Contract
    public string Status { get; set; } = "Active"; // Active, Inactive, OnLeave
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation Properties
    public ICollection<WorkerSkill> Skills { get; set; } = new List<WorkerSkill>();
    public ICollection<TaskAssignment> TaskAssignments { get; set; } = new List<TaskAssignment>();
}
