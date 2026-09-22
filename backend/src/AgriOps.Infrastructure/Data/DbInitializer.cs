using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using AgriOps.Core.Entities;

namespace AgriOps.Infrastructure.Data;

public static class DbInitializer
{
    public static async Task SeedAsync(ApplicationDbContext context)
    {
        await context.Database.EnsureCreatedAsync();

        if (await context.Workers.AnyAsync())
        {
            return; // DB has been seeded
        }

        var worker1 = new Worker
        {
            Id = Guid.Parse("11111111-1111-1111-1111-111111111111"),
            UserId = Guid.Parse("a1111111-1111-1111-1111-111111111111"),
            FullName = "John Silva",
            ContactNumber = "+94771234567",
            EmploymentType = "FullTime",
            Status = "Active",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var worker2 = new Worker
        {
            Id = Guid.Parse("22222222-2222-2222-2222-222222222222"),
            UserId = Guid.Parse("a2222222-2222-2222-2222-222222222222"),
            FullName = "Kamal Perera",
            ContactNumber = "+94779876543",
            EmploymentType = "Seasonal",
            Status = "Active",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var skills = new List<WorkerSkill>
        {
            new WorkerSkill { Id = Guid.NewGuid(), WorkerId = worker1.Id, SkillName = "ChemicalHandling", ProficiencyLevel = "Expert" },
            new WorkerSkill { Id = Guid.NewGuid(), WorkerId = worker1.Id, SkillName = "PestDiagnostic", ProficiencyLevel = "Intermediate" },
            new WorkerSkill { Id = Guid.NewGuid(), WorkerId = worker2.Id, SkillName = "IrrigationSetup", ProficiencyLevel = "Certified" },
            new WorkerSkill { Id = Guid.NewGuid(), WorkerId = worker2.Id, SkillName = "HeavyMachinery", ProficiencyLevel = "Beginner" }
        };

        var sampleTask = new FarmTask
        {
            Id = Guid.Parse("33333333-3333-3333-3333-333333333333"),
            FieldId = Guid.Parse("f1111111-1111-1111-1111-111111111111"),
            CropSeasonId = Guid.Parse("c1111111-1111-1111-1111-111111111111"),
            TaskType = "PestInspection",
            Priority = "High",
            Description = "Inspect Northern field section B for aphid infestation.",
            TargetDate = DateTime.UtcNow.AddDays(2),
            Status = "Pending",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await context.Workers.AddRangeAsync(worker1, worker2);
        await context.WorkerSkills.AddRangeAsync(skills);
        await context.Tasks.AddAsync(sampleTask);

        await context.SaveChangesAsync();
    }
}
