using System;
using System.Linq;
using System.Threading.Tasks;
using AgriOps.Core.Entities;
using AgriOps.Infrastructure.Services;
using AgriOps.Tests.Helpers;
using Xunit;

namespace AgriOps.Tests.Component2.Services;

[Collection("DatabaseTests")]
public class WorkerServiceTests : IAsyncLifetime
{
    private readonly AgriOps.Infrastructure.Data.ApplicationDbContext _context;
    private readonly WorkerService _workerService;

    public WorkerServiceTests()
    {
        _context = TestDbContextFactory.CreateDbContext();
        _workerService = new WorkerService(_context);
    }

    public Task InitializeAsync() => Task.CompletedTask;

    public async Task DisposeAsync()
    {
        await TestDbContextFactory.ResetDatabaseAsync(_context);
        await _context.DisposeAsync();
    }

    [Fact]
    public async Task CreateWorkerAsync_SavesWorkerWithUtcTimestamps()
    {
        var worker = TestDataBuilder.CreateWorker(fullName: "Mahesh Theekshana");

        var created = await _workerService.CreateWorkerAsync(worker);

        Assert.Equal("Mahesh Theekshana", created.FullName);
        Assert.NotEqual(Guid.Empty, created.Id);
        Assert.Equal(DateTimeKind.Utc, created.CreatedAt.Kind);

        var dbWorker = await _context.Workers.FindAsync(created.Id);
        Assert.NotNull(dbWorker);
    }

    [Fact]
    public async Task AddWorkerSkillAsync_WhenWorkerExists_AssociatesSkill()
    {
        var worker = TestDataBuilder.CreateWorker();
        _context.Workers.Add(worker);
        await _context.SaveChangesAsync();

        var skill = await _workerService.AddWorkerSkillAsync(worker.Id, "ChemicalHandling", "Advanced");

        Assert.Equal("ChemicalHandling", skill.SkillName);
        Assert.Equal("Advanced", skill.ProficiencyLevel);
        Assert.Equal(worker.Id, skill.WorkerId);

        var skills = await _workerService.GetWorkerSkillsAsync(worker.Id);
        Assert.Single(skills);
    }

    [Fact]
    public async Task IsWorkerQualifiedForTaskAsync_MapsSpecificSkillsCorrectly()
    {
        var worker = TestDataBuilder.CreateWorker(status: "Active");
        _context.Workers.Add(worker);
        await _context.SaveChangesAsync();

        await _workerService.AddWorkerSkillAsync(worker.Id, "PestDiagnostic", "Expert");

        // Qualified for PestInspection
        Assert.True(await _workerService.IsWorkerQualifiedForTaskAsync(worker.Id, "PestInspection"));

        // Not qualified for Watering (requires IrrigationSetup)
        Assert.False(await _workerService.IsWorkerQualifiedForTaskAsync(worker.Id, "Watering"));

        // Qualified for general tasks with no required skill mapping
        Assert.True(await _workerService.IsWorkerQualifiedForTaskAsync(worker.Id, "GeneralWeeding"));
    }

    [Fact]
    public async Task GetActiveTaskLoadCountAsync_CountsOnlyActiveAssignments()
    {
        var worker = TestDataBuilder.CreateWorker();
        _context.Workers.Add(worker);

        var task1 = TestDataBuilder.CreateFarmTask();
        var task2 = TestDataBuilder.CreateFarmTask();
        var task3 = TestDataBuilder.CreateFarmTask();
        _context.Tasks.AddRange(task1, task2, task3);
        await _context.SaveChangesAsync();

        _context.TaskAssignments.AddRange(
            new TaskAssignment { Id = Guid.NewGuid(), TaskId = task1.Id, WorkerId = worker.Id, Status = "Active", AssignedDate = DateTime.UtcNow },
            new TaskAssignment { Id = Guid.NewGuid(), TaskId = task2.Id, WorkerId = worker.Id, Status = "Active", AssignedDate = DateTime.UtcNow },
            new TaskAssignment { Id = Guid.NewGuid(), TaskId = task3.Id, WorkerId = worker.Id, Status = "Completed", AssignedDate = DateTime.UtcNow }
        );
        await _context.SaveChangesAsync();

        var activeCount = await _workerService.GetActiveTaskLoadCountAsync(worker.Id);
        Assert.Equal(2, activeCount);
    }
}
