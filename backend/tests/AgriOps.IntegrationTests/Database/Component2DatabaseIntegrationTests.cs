using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using AgriOps.Core.Entities;
using AgriOps.Infrastructure.Data;
using AgriOps.IntegrationTests.Infrastructure;
using Xunit;

namespace AgriOps.IntegrationTests.Database;

/// <summary>
/// Database Testing Suite for Component 2 (Nileesha De Silva's scope - Task, Workforce & Crop Diagnostics).
/// Evaluated using xUnit + PostgreSQL (Npgsql) + Entity Framework Core.
/// 
/// Categories covered:
/// 1. Database Integration Testing (PostgreSQL persistence, complex LINQ queries, state tracking)
/// 2. Constraint Testing (Not-null constraints, Foreign Key violations, String length)
/// 3. Relationship & Data-Integrity Testing (1-to-many relations, Cascade delete, Restrict delete behavior)
/// 4. Migration & Schema Testing (PostgreSQL connectivity, metadata verification, physical table checks)
/// 5. Transaction Testing (ACID compliance, Atomic Commit, Rollback isolation, Unit of Work)
/// </summary>
public class Component2DatabaseIntegrationTests : IntegrationTestBase
{
    public Component2DatabaseIntegrationTests(AgriOpsTestHost host) : base(host)
    {
    }

    #region 1. Database Integration Testing

    [Fact]
    public async Task DatabaseIntegration_CanPersistAndRetrieveTaskWithNavigations_AgainstPostgres()
    {
        using var db = CreateDbContext();

        var fieldId = Guid.NewGuid();
        var workerUserId = Guid.NewGuid();

        // 1. Arrange & Persist Worker
        var worker = new Worker
        {
            Id = Guid.NewGuid(),
            UserId = workerUserId,
            FullName = "Nileesha Field Specialist",
            ContactNumber = "+94771234567",
            EmploymentType = "FullTime",
            Status = "Active",
            CreatedAt = DateTime.UtcNow
        };
        db.Workers.Add(worker);

        // 2. Arrange & Persist Task
        var task = new FarmTask
        {
            Id = Guid.NewGuid(),
            FieldId = fieldId,
            Title = "Irrigation System Flush",
            TaskType = "Irrigation",
            Priority = "High",
            Status = "Pending",
            Description = "Calibrate drip emitter flow rates",
            TargetDate = DateTime.UtcNow.AddDays(2),
            CreatedAt = DateTime.UtcNow
        };
        db.Tasks.Add(task);

        // 3. Arrange & Persist Assignment
        var assignment = new TaskAssignment
        {
            Id = Guid.NewGuid(),
            TaskId = task.Id,
            WorkerId = worker.Id,
            Status = "Assigned",
            AssignedDate = DateTime.UtcNow
        };
        db.TaskAssignments.Add(assignment);

        // 4. Arrange & Persist Audit History
        var history = new TaskHistory
        {
            Id = Guid.NewGuid(),
            TaskId = task.Id,
            PreviousStatus = "Pending",
            NewStatus = "Assigned",
            Remarks = "Assigned to Nileesha Field Specialist",
            Timestamp = DateTime.UtcNow
        };
        db.TaskHistories.Add(history);

        await db.SaveChangesAsync();

        // Clear change tracker to ensure a true database round-trip
        db.ChangeTracker.Clear();

        // Query back from PostgreSQL with all relational navigations
        var retrievedTask = await db.Tasks
            .Include(t => t.Assignments)
                .ThenInclude(a => a.Worker)
            .Include(t => t.Histories)
            .FirstOrDefaultAsync(t => t.Id == task.Id);

        Assert.NotNull(retrievedTask);
        Assert.Equal("Irrigation System Flush", retrievedTask.Title);
        Assert.Equal("Irrigation", retrievedTask.TaskType);
        Assert.Single(retrievedTask.Assignments);
        Assert.NotNull(retrievedTask.Assignments.First().Worker);
        Assert.Equal("Nileesha Field Specialist", retrievedTask.Assignments.First().Worker!.FullName);
        Assert.Single(retrievedTask.Histories);
        Assert.Equal("Assigned", retrievedTask.Histories.First().NewStatus);
    }

    [Fact]
    public async Task DatabaseIntegration_ComplexLinqQueriesAndFiltering_ExecutesOnPostgres()
    {
        using var db = CreateDbContext();

        var fieldId = Guid.NewGuid();
        var now = DateTime.UtcNow;

        var tasks = new List<FarmTask>
        {
            new() { Id = Guid.NewGuid(), FieldId = fieldId, Title = "A-Pest", TaskType = "PestControl", Priority = "High", Status = "Pending", TargetDate = now.AddDays(1), CreatedAt = now },
            new() { Id = Guid.NewGuid(), FieldId = fieldId, Title = "B-Weed", TaskType = "Weeding", Priority = "Low", Status = "Pending", TargetDate = now.AddDays(5), CreatedAt = now },
            new() { Id = Guid.NewGuid(), FieldId = fieldId, Title = "C-Spray", TaskType = "PestControl", Priority = "High", Status = "InProgress", TargetDate = now.AddDays(2), CreatedAt = now },
            new() { Id = Guid.NewGuid(), FieldId = fieldId, Title = "D-Irrigate", TaskType = "Irrigation", Priority = "High", Status = "Pending", TargetDate = now.AddDays(3), CreatedAt = now }
        };

        db.Tasks.AddRange(tasks);
        await db.SaveChangesAsync();
        db.ChangeTracker.Clear();

        // Filter: Priority == High AND Status == Pending, sorted by TargetDate ascending
        var highPriorityPending = await db.Tasks
            .Where(t => t.Priority == "High" && t.Status == "Pending")
            .OrderBy(t => t.TargetDate)
            .ToListAsync();

        Assert.Equal(2, highPriorityPending.Count);
        Assert.Equal("A-Pest", highPriorityPending[0].Title);
        Assert.Equal("D-Irrigate", highPriorityPending[1].Title);
    }

    #endregion

    #region 2. Constraint Testing

    [Fact]
    public async Task Constraint_NotNullConstraint_ThrowsDbUpdateException_WhenRequiredFieldIsMissing()
    {
        using var db = CreateDbContext();

        // Worker entity requires FullName to be non-null and not empty
        var invalidWorker = new Worker
        {
            Id = Guid.NewGuid(),
            UserId = Guid.NewGuid(),
            FullName = null!, // Violates NOT NULL constraint
            EmploymentType = "FullTime",
            Status = "Active",
            CreatedAt = DateTime.UtcNow
        };

        db.Workers.Add(invalidWorker);

        // PostgreSQL rejects NOT NULL violation on "FullName" column
        await Assert.ThrowsAsync<DbUpdateException>(() => db.SaveChangesAsync());
    }

    [Fact]
    public async Task Constraint_ForeignKeyConstraint_ThrowsDbUpdateException_WhenReferencingNonExistentWorker()
    {
        using var db = CreateDbContext();

        var task = new FarmTask
        {
            Id = Guid.NewGuid(),
            FieldId = Guid.NewGuid(),
            Title = "Task with Invalid Assignment",
            TaskType = "Pruning",
            Priority = "Medium",
            Status = "Pending",
            TargetDate = DateTime.UtcNow.AddDays(1),
            CreatedAt = DateTime.UtcNow
        };
        db.Tasks.Add(task);

        // Non-existent WorkerId
        var invalidAssignment = new TaskAssignment
        {
            Id = Guid.NewGuid(),
            TaskId = task.Id,
            WorkerId = Guid.NewGuid(), // Non-existent foreign key
            Status = "Assigned",
            AssignedDate = DateTime.UtcNow
        };
        db.TaskAssignments.Add(invalidAssignment);

        // PostgreSQL enforces foreign key referential integrity
        await Assert.ThrowsAsync<DbUpdateException>(() => db.SaveChangesAsync());
    }

    #endregion

    #region 3. Relationship and Data-Integrity Testing

    [Fact]
    public async Task Relationship_CascadeDelete_TaskDeletionRemovesChildAssignmentsAndHistories()
    {
        using var db = CreateDbContext();

        var worker = new Worker
        {
            Id = Guid.NewGuid(),
            UserId = Guid.NewGuid(),
            FullName = "Amara Dias",
            EmploymentType = "FullTime",
            Status = "Active",
            CreatedAt = DateTime.UtcNow
        };
        db.Workers.Add(worker);

        var task = new FarmTask
        {
            Id = Guid.NewGuid(),
            FieldId = Guid.NewGuid(),
            Title = "Cascade Testing Task",
            TaskType = "SoilSampling",
            Priority = "Low",
            Status = "Assigned",
            TargetDate = DateTime.UtcNow.AddDays(1),
            CreatedAt = DateTime.UtcNow
        };
        db.Tasks.Add(task);

        var assignment = new TaskAssignment
        {
            Id = Guid.NewGuid(),
            TaskId = task.Id,
            WorkerId = worker.Id,
            Status = "Active",
            AssignedDate = DateTime.UtcNow
        };
        db.TaskAssignments.Add(assignment);

        var history = new TaskHistory
        {
            Id = Guid.NewGuid(),
            TaskId = task.Id,
            PreviousStatus = "Pending",
            NewStatus = "Assigned",
            Timestamp = DateTime.UtcNow
        };
        db.TaskHistories.Add(history);

        await db.SaveChangesAsync();
        db.ChangeTracker.Clear();

        // Verify entities exist in PostgreSQL
        Assert.NotNull(await db.Tasks.FindAsync(task.Id));
        Assert.NotNull(await db.TaskAssignments.FindAsync(assignment.Id));
        Assert.NotNull(await db.TaskHistories.FindAsync(history.Id));

        // Delete parent FarmTask
        var taskToDelete = await db.Tasks.FindAsync(task.Id);
        db.Tasks.Remove(taskToDelete!);
        await db.SaveChangesAsync();
        db.ChangeTracker.Clear();

        // Verify Cascade Delete purged child records from PostgreSQL
        Assert.Null(await db.Tasks.FindAsync(task.Id));
        Assert.Null(await db.TaskAssignments.FindAsync(assignment.Id));
        Assert.Null(await db.TaskHistories.FindAsync(history.Id));

        // Worker itself must remain untouched (Worker was not deleted)
        Assert.NotNull(await db.Workers.FindAsync(worker.Id));
    }

    [Fact]
    public async Task Relationship_RestrictDelete_DeletingWorkerWithActiveAssignments_ThrowsDbUpdateException()
    {
        using var db = CreateDbContext();

        var worker = new Worker
        {
            Id = Guid.NewGuid(),
            UserId = Guid.NewGuid(),
            FullName = "Protected Worker",
            EmploymentType = "FullTime",
            Status = "Active",
            CreatedAt = DateTime.UtcNow
        };
        db.Workers.Add(worker);

        var task = new FarmTask
        {
            Id = Guid.NewGuid(),
            FieldId = Guid.NewGuid(),
            Title = "Restrict Testing Task",
            TaskType = "Fertilization",
            Priority = "Medium",
            Status = "Assigned",
            TargetDate = DateTime.UtcNow.AddDays(1),
            CreatedAt = DateTime.UtcNow
        };
        db.Tasks.Add(task);

        var assignment = new TaskAssignment
        {
            Id = Guid.NewGuid(),
            TaskId = task.Id,
            WorkerId = worker.Id,
            Status = "Active",
            AssignedDate = DateTime.UtcNow
        };
        db.TaskAssignments.Add(assignment);

        await db.SaveChangesAsync();
        db.ChangeTracker.Clear();

        // Attempting to delete a Worker with an active assignment must be rejected by DeleteBehavior.Restrict
        var workerToDelete = await db.Workers.FindAsync(worker.Id);
        db.Workers.Remove(workerToDelete!);

        await Assert.ThrowsAsync<DbUpdateException>(() => db.SaveChangesAsync());
    }

    [Fact]
    public async Task Relationship_WorkerSkillsCascadeDelete_RemovingWorkerDeletesAllSkills()
    {
        using var db = CreateDbContext();

        var worker = new Worker
        {
            Id = Guid.NewGuid(),
            UserId = Guid.NewGuid(),
            FullName = "Skilled Agronomist",
            EmploymentType = "FullTime",
            Status = "Active",
            CreatedAt = DateTime.UtcNow
        };
        db.Workers.Add(worker);

        var skill1 = new WorkerSkill { Id = Guid.NewGuid(), WorkerId = worker.Id, SkillName = "PesticideCertified", ProficiencyLevel = "Certified" };
        var skill2 = new WorkerSkill { Id = Guid.NewGuid(), WorkerId = worker.Id, SkillName = "IrrigationManagement", ProficiencyLevel = "Intermediate" };
        db.WorkerSkills.AddRange(skill1, skill2);

        await db.SaveChangesAsync();
        db.ChangeTracker.Clear();

        // Delete Worker
        var workerToDelete = await db.Workers.FindAsync(worker.Id);
        db.Workers.Remove(workerToDelete!);
        await db.SaveChangesAsync();
        db.ChangeTracker.Clear();

        // Verify skills were cascade deleted
        var skills = await db.WorkerSkills.Where(s => s.WorkerId == worker.Id).ToListAsync();
        Assert.Empty(skills);
    }

    #endregion

    #region 4. Migration & Schema Testing

    [Fact]
    public async Task Migration_DatabaseConnectionAndSchemaIntegrity_VerifiedAgainstPostgres()
    {
        using var db = CreateDbContext();

        // 1. Verify live connection to PostgreSQL
        bool canConnect = await db.Database.CanConnectAsync();
        Assert.True(canConnect, "PostgreSQL database must be reachable for integration testing.");

        // 2. Verify EF Core Model Metadata contains all Component 2 entities
        var entityTypes = db.Model.GetEntityTypes().Select(e => e.ClrType).ToList();

        Assert.Contains(typeof(FarmTask), entityTypes);
        Assert.Contains(typeof(Worker), entityTypes);
        Assert.Contains(typeof(WorkerSkill), entityTypes);
        Assert.Contains(typeof(TaskAssignment), entityTypes);
        Assert.Contains(typeof(TaskHistory), entityTypes);
        Assert.Contains(typeof(CropAnalysisAssessment), entityTypes);
        Assert.Contains(typeof(ApprovalItem), entityTypes);

        // 3. Verify Primary Key metadata
        var taskEntityType = db.Model.FindEntityType(typeof(FarmTask));
        var pk = taskEntityType?.FindPrimaryKey();
        Assert.NotNull(pk);
        Assert.Equal(nameof(FarmTask.Id), pk.Properties.Single().Name);
    }

    [Fact]
    public async Task Migration_SchemaTablesExistInPostgreSQL_AndCanBeQueried()
    {
        using var db = CreateDbContext();

        // Execute raw PostgreSQL SQL queries to confirm physical tables exist
        int taskCount = await db.Database.SqlQueryRaw<int>(@"SELECT COUNT(*)::int AS ""Value"" FROM ""Tasks""").FirstAsync();
        int workerCount = await db.Database.SqlQueryRaw<int>(@"SELECT COUNT(*)::int AS ""Value"" FROM ""Workers""").FirstAsync();
        int historyCount = await db.Database.SqlQueryRaw<int>(@"SELECT COUNT(*)::int AS ""Value"" FROM ""TaskHistories""").FirstAsync();

        Assert.True(taskCount >= 0);
        Assert.True(workerCount >= 0);
        Assert.True(historyCount >= 0);
    }

    #endregion

    #region 5. Transaction Testing (ACID Compliance)

    [Fact]
    public async Task Transaction_AtomicCommit_PersistsAllRelatedEntitiesTogether()
    {
        using var db = CreateDbContext();

        var taskId = Guid.NewGuid();
        var workerId = Guid.NewGuid();

        // Begin explicit transaction
        await using var transaction = await db.Database.BeginTransactionAsync();

        var worker = new Worker
        {
            Id = workerId,
            UserId = Guid.NewGuid(),
            FullName = "Transactional Worker",
            EmploymentType = "FullTime",
            Status = "Active",
            CreatedAt = DateTime.UtcNow
        };
        db.Workers.Add(worker);

        var task = new FarmTask
        {
            Id = taskId,
            FieldId = Guid.NewGuid(),
            Title = "Atomic Transaction Task",
            TaskType = "Harvest",
            Priority = "High",
            Status = "Pending",
            TargetDate = DateTime.UtcNow.AddDays(3),
            CreatedAt = DateTime.UtcNow
        };
        db.Tasks.Add(task);

        await db.SaveChangesAsync();

        // Commit transaction
        await transaction.CommitAsync();

        // In a fresh DbContext instance, verify both entities were committed
        using var verifyDb = CreateDbContext();
        Assert.NotNull(await verifyDb.Workers.FindAsync(workerId));
        Assert.NotNull(await verifyDb.Tasks.FindAsync(taskId));
    }

    [Fact]
    public async Task Transaction_Rollback_RestoresInitialStateAndPreventsPartialWrites()
    {
        using var db = CreateDbContext();
        var taskId = Guid.NewGuid();

        // Begin transaction
        await using var transaction = await db.Database.BeginTransactionAsync();

        var task = new FarmTask
        {
            Id = taskId,
            FieldId = Guid.NewGuid(),
            Title = "Rollback Target Task",
            TaskType = "Weeding",
            Priority = "Low",
            Status = "Pending",
            TargetDate = DateTime.UtcNow.AddDays(4),
            CreatedAt = DateTime.UtcNow
        };
        db.Tasks.Add(task);
        await db.SaveChangesAsync();

        // Rollback transaction explicitly
        await transaction.RollbackAsync();

        // In a separate DbContext instance, verify entity was NOT persisted
        using var verifyDb = CreateDbContext();
        var foundTask = await verifyDb.Tasks.FindAsync(taskId);
        Assert.Null(foundTask);
    }

    [Fact]
    public async Task Transaction_FailureInSubOperation_RollsBackEntireUnitOfWork()
    {
        using var db = CreateDbContext();
        var workerId = Guid.NewGuid();

        await using var transaction = await db.Database.BeginTransactionAsync();

        try
        {
            // 1. Valid operation
            var worker = new Worker
            {
                Id = workerId,
                UserId = Guid.NewGuid(),
                FullName = "Should Not Persist Worker",
                EmploymentType = "FullTime",
                Status = "Active",
                CreatedAt = DateTime.UtcNow
            };
            db.Workers.Add(worker);
            await db.SaveChangesAsync();

            // 2. Deliberately invalid operation (foreign key violation)
            var invalidAssignment = new TaskAssignment
            {
                Id = Guid.NewGuid(),
                TaskId = Guid.NewGuid(), // Non-existent task
                WorkerId = workerId,
                Status = "Active",
                AssignedDate = DateTime.UtcNow
            };
            db.TaskAssignments.Add(invalidAssignment);
            await db.SaveChangesAsync();

            await transaction.CommitAsync();
        }
        catch (DbUpdateException)
        {
            // Expected failure: Roll back the transaction
            await transaction.RollbackAsync();
        }

        // Verify that the worker from Step 1 was ALSO rolled back (Atomicity)
        using var verifyDb = CreateDbContext();
        var workerInDb = await verifyDb.Workers.FindAsync(workerId);
        Assert.Null(workerInDb);
    }

    #endregion
}
