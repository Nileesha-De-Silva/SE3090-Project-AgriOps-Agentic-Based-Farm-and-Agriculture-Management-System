using System;

namespace AgriOps.Core.Entities;

public class WorkerSkill
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid WorkerId { get; set; }
    public string SkillName { get; set; } = string.Empty; // e.g., ChemicalHandling, HeavyMachinery, IrrigationSetup
    public string ProficiencyLevel { get; set; } = "Intermediate"; // Beginner, Intermediate, Expert, Certified
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation Property
    public Worker? Worker { get; set; }
}
