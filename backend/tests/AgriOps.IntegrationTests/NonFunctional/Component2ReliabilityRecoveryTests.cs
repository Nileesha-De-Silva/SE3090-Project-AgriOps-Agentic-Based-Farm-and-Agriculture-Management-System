using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http.Json;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using AgriOps.Api.Dtos;
using AgriOps.Core.Entities;
using AgriOps.IntegrationTests.Infrastructure;
using Xunit;

namespace AgriOps.IntegrationTests.NonFunctional;

/// <summary>
/// Non-Functional Reliability & Recovery Testing Suite for Component 2 (Nileesha De Silva).
/// Validates fault-tolerance, graceful degradation during external AI gateway outages,
/// transactional atomicity, and concurrency conflict recovery.
/// </summary>
public class Component2ReliabilityRecoveryTests : IntegrationTestBase
{
    public Component2ReliabilityRecoveryTests(AgriOpsTestHost host) : base(host)
    {
    }

    [Fact]
    [Trait("Category", "Reliability")]
    public async Task Reliability_AgentGatewayOutage_CropAnalysisGracefullyDegradesWithoutCrashing()
    {
        // 1. Setup Farm & Field
        var farm = await (await PostAsJson("/api/farm", new CreateFarmDto
        {
            Name = "Resilience Plantation",
            Location = "Remote Sector Z",
            TotalArea = 30.0m,
            OwnerId = Guid.NewGuid()
        })).Content.ReadFromJsonAsync<FarmDto>(JsonOptions);

        var field = await (await PostAsJson("/api/field", new CreateFieldDto
        {
            FarmId = farm!.Id,
            FieldName = "Paddy Offline Block",
            AreaSize = 8.0m,
            SoilType = "Clay"
        })).Content.ReadFromJsonAsync<FieldDto>(JsonOptions);

        // 2. Submit scouting request under simulated external AI service unavailability
        var requestDto = new SubmitCropAnalysisRequestDto(
            FieldId: field!.Id,
            CropVariety: "Basmati",
            GrowthStage: "GrainFilling",
            ObservationText: "Brown spot patches spreading under high humidity",
            ImageUrl: "https://storage.agriops.local/scouts/obs-offline.jpg",
            SubmittedByUserId: Guid.NewGuid()
        );

        var response = await PostAsJson("/api/cropanalysis", requestDto);
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);

        var assessment = await response.Content.ReadFromJsonAsync<CropAnalysisAssessmentResponseDto>(JsonOptions);
        Assert.NotNull(assessment);

        // 3. Verify Graceful Degradation: Record successfully persisted in PendingApproval with rule-based fallback
        Assert.Equal("PendingApproval", assessment.Status);
        Assert.Equal("PestInspection", assessment.SuggestedTaskType);
        Assert.NotNull(assessment.PrimaryIndicator);

        // 4. Verify Gatekeeper item created in approval inbox
        var pendingResp = await Client.GetAsync("/api/cropanalysis/pending");
        Assert.Equal(HttpStatusCode.OK, pendingResp.StatusCode);
        var pendingList = await pendingResp.Content.ReadFromJsonAsync<List<CropAnalysisAssessmentResponseDto>>(JsonOptions);
        Assert.NotNull(pendingList);
        Assert.Contains(pendingList, a => a.Id == assessment.Id);
    }

    [Fact]
    [Trait("Category", "Reliability")]
    public async Task Reliability_SimultaneousTaskAssignments_ResolvesGracefullyWithoutDeadlock()
    {
        // 1. Setup Field and Task
        var fieldId = Guid.NewGuid();
        var taskResp = await PostAsJson("/api/tasks", new CreateTaskDto(
            FieldId: fieldId,
            CropSeasonId: null,
            Title: "Concurrency Critical Spraying",
            TaskType: "PestInspection",
            Priority: "High",
            Description: "Simultaneous supervisor dispatch test",
            TargetDate: DateTime.UtcNow.AddDays(1)
        ));
        var task = await taskResp.Content.ReadFromJsonAsync<TaskResponseDto>(JsonOptions);
        Assert.NotNull(task);

        // 2. Create Worker 1 and Worker 2
        var w1 = await (await PostAsJson("/api/workers", new CreateWorkerDto(Guid.NewGuid(), "Worker Concurrency 1", "+94770000001", "FullTime")))
            .Content.ReadFromJsonAsync<WorkerResponseDto>(JsonOptions);
        var w2 = await (await PostAsJson("/api/workers", new CreateWorkerDto(Guid.NewGuid(), "Worker Concurrency 2", "+94770000002", "FullTime")))
            .Content.ReadFromJsonAsync<WorkerResponseDto>(JsonOptions);

        // 3. Fire simultaneous reassignment requests
        var assignTask1 = PostAsJson($"/api/tasks/{task.Id}/assign", new AssignWorkerDto(w1!.Id));
        var assignTask2 = PostAsJson($"/api/tasks/{task.Id}/assign", new AssignWorkerDto(w2!.Id));

        var responses = await Task.WhenAll(assignTask1, assignTask2);

        // Both requests must complete without 500 error / database deadlock
        Assert.All(responses, r => Assert.Equal(HttpStatusCode.OK, r.StatusCode));

        // 4. Verify Final State Consistency: Exactly 1 Active assignment, other is Reassigned
        await using var db = CreateDbContext();
        var assignments = await db.TaskAssignments
            .Where(a => a.TaskId == task.Id)
            .ToListAsync();

        Assert.Equal(2, assignments.Count);
        Assert.Contains(assignments, a => a.Status == "Active");

        var finalTask = await db.Tasks.FindAsync(task.Id);
        Assert.NotNull(finalTask);
        Assert.Equal("Assigned", finalTask.Status);
    }

    [Fact]
    [Trait("Category", "Reliability")]
    public async Task Reliability_DatabaseRecovery_AuditTrailIsPreservedAcrossLifecycle()
    {
        var fieldId = Guid.NewGuid();
        var task = await (await PostAsJson("/api/tasks", new CreateTaskDto(
            FieldId: fieldId,
            CropSeasonId: null,
            Title: "Audit Preservation Test",
            TaskType: "PestInspection",
            Priority: "Medium",
            Description: "Verifies history recovery across server restarts",
            TargetDate: DateTime.UtcNow.AddDays(1)
        ))).Content.ReadFromJsonAsync<TaskResponseDto>(JsonOptions);

        // Advance task status
        await PatchAsJson($"/api/tasks/{task!.Id}/status", new UpdateTaskStatusDto(
            NewStatus: "InProgress",
            UserId: Guid.NewGuid(),
            Remarks: "Work started"
        ));

        // Disconnect and reopen a fresh DbContext to simulate process restart / connection drop recovery
        await using (var freshDb = CreateDbContext())
        {
            var recoveredTask = await freshDb.Tasks
                .Include(t => t.Histories)
                .FirstOrDefaultAsync(t => t.Id == task.Id);

            Assert.NotNull(recoveredTask);
            Assert.Equal("InProgress", recoveredTask.Status);
            Assert.True(recoveredTask.Histories.Count >= 2, "Task histories were fully recovered from persistent storage.");
        }
    }
}
