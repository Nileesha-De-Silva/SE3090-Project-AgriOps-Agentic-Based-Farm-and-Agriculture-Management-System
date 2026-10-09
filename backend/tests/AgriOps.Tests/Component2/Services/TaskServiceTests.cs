using System;
using System.Linq;
using System.Threading.Tasks;
using AgriOps.Core.Entities;
using AgriOps.Infrastructure.Services;
using AgriOps.Tests.Helpers;
using Xunit;

namespace AgriOps.Tests.Component2.Services;

[Collection("DatabaseTests")]
public class TaskServiceTests : IAsyncLifetime
{
    private readonly AgriOps.Infrastructure.Data.ApplicationDbContext _context;
    private readonly TaskService _taskService;

    public TaskServiceTests()
    {
        _context = TestDbContextFactory.CreateDbContext();
        _taskService = new TaskService(_context);
    }

    public Task InitializeAsync() => Task.CompletedTask;

    public async Task DisposeAsync()
    {
        await TestDbContextFactory.ResetDatabaseAsync(_context);
        await _context.DisposeAsync();
    }

    [Fact]
    public async Task CreateTaskAsync_InitializesStatusToPending_AndCreatesTaskHistory()
    {
        var task = TestDataBuilder.CreateFarmTask(taskType: "Weeding", priority: "Medium", status: "Pending");

        var created = await _taskService.CreateTaskAsync(task);

        Assert.Equal("Pending", created.Status);
        Assert.NotEqual(Guid.Empty, created.Id);
        Assert.Equal(DateTimeKind.Utc, created.CreatedAt.Kind);

        // Verify audit history was automatically logged
        var histories = await _taskService.GetTaskHistoryAsync(created.Id);
        var initialHistory = Assert.Single(histories);
        Assert.Equal("None", initialHistory.PreviousStatus);
        Assert.Equal("Pending", initialHistory.NewStatus);
        Assert.Equal("Task manually created", initialHistory.Remarks);
    }

    [Fact]
    public async Task AssignWorkerAsync_TransitionsStatusToAssigned_AndMarksPreviousWorkerReassigned()
    {
        // 1. Arrange task and two workers
        var task = TestDataBuilder.CreateFarmTask(status: "Pending");
        _context.Tasks.Add(task);

        var worker1 = TestDataBuilder.CreateWorker(fullName: "Nimal Perera");
        var worker2 = TestDataBuilder.CreateWorker(fullName: "Kamal Silva");
        _context.Workers.AddRange(worker1, worker2);
        await _context.SaveChangesAsync();

        // 2. Assign Worker 1
        var assignment1 = await _taskService.AssignWorkerAsync(task.Id, worker1.Id);
        Assert.Equal("Active", assignment1.Status);

        var taskAfterFirstAssign = await _taskService.GetTaskByIdAsync(task.Id);
        Assert.Equal("Assigned", taskAfterFirstAssign!.Status);

        // 3. Reassign to Worker 2
        var assignment2 = await _taskService.AssignWorkerAsync(task.Id, worker2.Id);
        Assert.Equal("Active", assignment2.Status);

        // 4. Verify previous assignment is marked "Reassigned"
        var updatedTask = await _taskService.GetTaskByIdAsync(task.Id);
        Assert.Equal("Assigned", updatedTask!.Status);
        Assert.Equal(2, updatedTask.Assignments.Count);

        var previousAssign = updatedTask.Assignments.First(a => a.WorkerId == worker1.Id);
        var currentAssign = updatedTask.Assignments.First(a => a.WorkerId == worker2.Id);
        Assert.Equal("Reassigned", previousAssign.Status);
        Assert.Equal("Active", currentAssign.Status);
    }

    [Fact]
    public async Task AssignWorkerAsync_ThrowsInvalidOperationException_WhenTaskOrWorkerNotFound()
    {
        var validWorker = TestDataBuilder.CreateWorker();
        _context.Workers.Add(validWorker);
        await _context.SaveChangesAsync();

        // Non-existent task
        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            _taskService.AssignWorkerAsync(Guid.NewGuid(), validWorker.Id));

        // Non-existent worker
        var validTask = TestDataBuilder.CreateFarmTask();
        _context.Tasks.Add(validTask);
        await _context.SaveChangesAsync();

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            _taskService.AssignWorkerAsync(validTask.Id, Guid.NewGuid()));
    }

    [Fact]
    public async Task UpdateTaskStatusAsync_TransitionsStatus_AndRecordsAuditTrail()
    {
        var task = TestDataBuilder.CreateFarmTask(status: "Assigned");
        _context.Tasks.Add(task);
        await _context.SaveChangesAsync();

        var userId = Guid.NewGuid();
        var updated = await _taskService.UpdateTaskStatusAsync(task.Id, "InProgress", userId, "Field tractor deployed.");

        Assert.Equal("InProgress", updated.Status);

        var histories = (await _taskService.GetTaskHistoryAsync(task.Id)).ToList();
        var statusHistory = Assert.Single(histories, h => h.NewStatus == "InProgress");
        Assert.Equal("Assigned", statusHistory.PreviousStatus);
        Assert.Equal("Field tractor deployed.", statusHistory.Remarks);
        Assert.Equal(userId, statusHistory.ChangedByUserId);
    }

    [Fact]
    public async Task SubmitTaskEvidenceAsync_TransitionsStatusToPendingVerification_AndStoresEvidencePhotoUrl()
    {
        var task = TestDataBuilder.CreateFarmTask(status: "InProgress");
        _context.Tasks.Add(task);
        await _context.SaveChangesAsync();

        var workerUserId = Guid.NewGuid();
        var photoUrl = "https://cdn.agriops.io/evidence/spray_proof_99.jpg";
        var remarks = "Completed full 5 hectares foliar spray application.";

        var history = await _taskService.SubmitTaskEvidenceAsync(task.Id, photoUrl, remarks, workerUserId);

        Assert.Equal("PendingVerification", history.NewStatus);
        Assert.Equal("InProgress", history.PreviousStatus);
        Assert.Equal(photoUrl, history.EvidencePhotoUrl);
        Assert.Equal(remarks, history.Remarks);
        Assert.Equal(workerUserId, history.ChangedByUserId);

        var updatedTask = await _taskService.GetTaskByIdAsync(task.Id);
        Assert.Equal("PendingVerification", updatedTask!.Status);
    }

    [Fact]
    public async Task VerifyTaskEvidenceAsync_WhenApproved_TransitionsStatusToCompleted()
    {
        var task = TestDataBuilder.CreateFarmTask(status: "PendingVerification");
        _context.Tasks.Add(task);
        await _context.SaveChangesAsync();

        var managerUserId = Guid.NewGuid();
        var updated = await _taskService.VerifyTaskEvidenceAsync(task.Id, isApproved: true, managerUserId, "Evidence verified, quality approved.");

        Assert.Equal("Completed", updated.Status);

        var histories = (await _taskService.GetTaskHistoryAsync(task.Id)).ToList();
        var verifyHistory = Assert.Single(histories, h => h.NewStatus == "Completed");
        Assert.Equal("PendingVerification", verifyHistory.PreviousStatus);
        Assert.Equal("Evidence verified, quality approved.", verifyHistory.Remarks);
        Assert.Equal(managerUserId, verifyHistory.ChangedByUserId);
    }

    [Fact]
    public async Task VerifyTaskEvidenceAsync_WhenRejected_RevertsStatusToInProgress_WithReworkFeedback()
    {
        var task = TestDataBuilder.CreateFarmTask(status: "PendingVerification");
        _context.Tasks.Add(task);
        await _context.SaveChangesAsync();

        var managerUserId = Guid.NewGuid();
        var reworkFeedback = "Canopy undersides were missed. Rework required.";
        var updated = await _taskService.VerifyTaskEvidenceAsync(task.Id, isApproved: false, managerUserId, reworkFeedback);

        Assert.Equal("InProgress", updated.Status);

        var histories = (await _taskService.GetTaskHistoryAsync(task.Id)).ToList();
        var rejectionHistory = Assert.Single(histories, h => h.NewStatus == "InProgress");
        Assert.Equal("PendingVerification", rejectionHistory.PreviousStatus);
        Assert.Equal(reworkFeedback, rejectionHistory.Remarks);
    }
}
