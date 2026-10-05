using System;

namespace AgriOps.Core.Entities;

public class TaskAssignment
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid TaskId { get; set; }
    public Guid WorkerId { get; set; }
    public DateTime AssignedDate { get; set; } = DateTime.UtcNow;
    public string Status { get; set; } = "Active"; // Active, Reassigned, Completed, Released

    // Navigation Properties
    public FarmTask? Task { get; set; }
    public Worker? Worker { get; set; }
}
