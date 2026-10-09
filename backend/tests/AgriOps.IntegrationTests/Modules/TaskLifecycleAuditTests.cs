using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http.Json;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using AgriOps.Api.Dtos;
using AgriOps.IntegrationTests.Infrastructure;
using Xunit;

namespace AgriOps.IntegrationTests.Modules;

public class TaskLifecycleAuditTests : IntegrationTestBase
{
    public TaskLifecycleAuditTests(AgriOpsTestHost host) : base(host)
    {
    }

    [Fact]
    public async Task FullTaskLifecycle_FromPendingToCompleted_WithReworkRejectionAndAuditLog()
    {
        var workerUserId = Guid.NewGuid();
        var managerUserId = Guid.NewGuid();

        // 1. Create Farm & Field
        var farm = await (await PostAsJson("/api/farm", new CreateFarmDto
        {
            Name = "Audit Farm",
            Location = "Plot 9",
            TotalArea = 15.0m,
            OwnerId = Guid.NewGuid()
        })).Content.ReadFromJsonAsync<FarmDto>(JsonOptions);

        var field = await (await PostAsJson("/api/field", new CreateFieldDto
        {
            FarmId = farm!.Id,
            FieldName = "F-Audit",
            AreaSize = 8.0m,
            SoilType = "Loamy"
        })).Content.ReadFromJsonAsync<FieldDto>(JsonOptions);

        // 2. Create Worker
        var worker = await (await PostAsJson("/api/workers", new CreateWorkerDto(
            UserId: workerUserId,
            FullName: "Namal Rajapakse",
            ContactNumber: "+94770001122",
            EmploymentType: "FullTime"
        ))).Content.ReadFromJsonAsync<WorkerResponseDto>(JsonOptions);

        // 3. Step 1: Create Task -> Status starts in "Pending"
        var taskCreateDto = new CreateTaskDto(
            FieldId: field!.Id,
            CropSeasonId: null,
            Title: "Border Irrigation Inspection",
            TaskType: "Watering",
            Priority: "High",
            Description: "Check water flow sensors and clean sluice gate",
            TargetDate: DateTime.UtcNow.AddDays(2)
        );

        var taskResponse = await PostAsJson("/api/tasks", taskCreateDto);
        Assert.Equal(HttpStatusCode.Created, taskResponse.StatusCode);

        var task = await taskResponse.Content.ReadFromJsonAsync<TaskResponseDto>(JsonOptions);
        Assert.NotNull(task);
        Assert.Equal("Pending", task.Status);

        // 4. Step 2: Assign Worker -> Status transitions to "Assigned"
        var assignResponse = await PostAsJson($"/api/tasks/{task.Id}/assign", new AssignWorkerDto(worker!.Id));
        Assert.Equal(HttpStatusCode.OK, assignResponse.StatusCode);

        var assignedTask = await GetFromJson<TaskResponseDto>($"/api/tasks/{task.Id}");
        Assert.NotNull(assignedTask);
        Assert.Equal("Assigned", assignedTask.Status);

        // Worker workload should be 1
        var workerAfterAssign = await GetFromJson<WorkerResponseDto>($"/api/workers/{worker.Id}");
        Assert.NotNull(workerAfterAssign);
        Assert.Equal(1, workerAfterAssign.ActiveWorkloadCount);

        // 5. Step 3: Worker begins work -> Status updates to "InProgress"
        var statusResponse = await PatchAsJson($"/api/tasks/{task.Id}/status", new UpdateTaskStatusDto(
            NewStatus: "InProgress",
            UserId: workerUserId,
            Remarks: "Work started on sluice gate"
        ));
        Assert.Equal(HttpStatusCode.OK, statusResponse.StatusCode);

        var inProgressTask = await statusResponse.Content.ReadFromJsonAsync<TaskResponseDto>(JsonOptions);
        Assert.NotNull(inProgressTask);
        Assert.Equal("InProgress", inProgressTask.Status);

        // 6. Step 4: Worker submits evidence -> Status transitions to "PendingVerification"
        var evidenceResp1 = await PostAsJson($"/api/tasks/{task.Id}/evidence", new SubmitEvidenceDto(
            EvidencePhotoUrl: "https://cdn.agriops.local/evidence/sluice1.jpg",
            Remarks: "Cleaned main sluice, needs inspection",
            WorkerUserId: workerUserId
        ));
        Assert.Equal(HttpStatusCode.OK, evidenceResp1.StatusCode);

        var pendingVerifyTask = await GetFromJson<TaskResponseDto>($"/api/tasks/{task.Id}");
        Assert.NotNull(pendingVerifyTask);
        Assert.Equal("PendingVerification", pendingVerifyTask.Status);

        // 7. Step 5: Farm Manager REJECTS evidence -> Status reverts to "InProgress" with rework feedback
        var verifyRejectResp = await PostAsJson($"/api/tasks/{task.Id}/verify", new VerifyEvidenceDto(
            IsApproved: false,
            ManagerUserId: managerUserId,
            Remarks: "Sluice gate side channel still obstructed. Clear before sign-off."
        ));
        Assert.Equal(HttpStatusCode.OK, verifyRejectResp.StatusCode);

        var reworkedTask = await verifyRejectResp.Content.ReadFromJsonAsync<TaskResponseDto>(JsonOptions);
        Assert.NotNull(reworkedTask);
        Assert.Equal("InProgress", reworkedTask.Status);

        // 8. Step 6: Worker resubmits revised evidence -> Status transitions to "PendingVerification"
        var evidenceResp2 = await PostAsJson($"/api/tasks/{task.Id}/evidence", new SubmitEvidenceDto(
            EvidencePhotoUrl: "https://cdn.agriops.local/evidence/sluice2_cleared.jpg",
            Remarks: "Side channels fully unblocked now",
            WorkerUserId: workerUserId
        ));
        Assert.Equal(HttpStatusCode.OK, evidenceResp2.StatusCode);

        // 9. Step 7: Farm Manager APPROVES evidence -> Status transitions to "Completed"
        var verifyApproveResp = await PostAsJson($"/api/tasks/{task.Id}/verify", new VerifyEvidenceDto(
            IsApproved: true,
            ManagerUserId: managerUserId,
            Remarks: "Confirmed clear and verified."
        ));
        Assert.Equal(HttpStatusCode.OK, verifyApproveResp.StatusCode);

        var completedTask = await verifyApproveResp.Content.ReadFromJsonAsync<TaskResponseDto>(JsonOptions);
        Assert.NotNull(completedTask);
        Assert.Equal("Completed", completedTask.Status);

        // 10. Step 8: Verify immutable TaskHistory audit trail
        var historyResp = await Client.GetAsync($"/api/tasks/{task.Id}/history");
        Assert.Equal(HttpStatusCode.OK, historyResp.StatusCode);

        var historyList = await historyResp.Content.ReadFromJsonAsync<List<TaskHistoryDto>>(JsonOptions);
        Assert.NotNull(historyList);
        Assert.True(historyList.Count >= 6, $"Expected at least 6 history records, but found {historyList.Count}");

        // Verify key transitions exist in audit history
        Assert.Contains(historyList, h => h.PreviousStatus == "None" && h.NewStatus == "Pending");
        Assert.Contains(historyList, h => h.NewStatus == "Assigned");
        Assert.Contains(historyList, h => h.NewStatus == "InProgress");
        Assert.Contains(historyList, h => h.NewStatus == "PendingVerification");
        Assert.Contains(historyList, h => h.PreviousStatus == "PendingVerification" && h.NewStatus == "InProgress" && h.Remarks!.Contains("obstructed"));
        Assert.Contains(historyList, h => h.NewStatus == "Completed");

        // 11. Step 9: Verify task is completed via API and worker has active assignment
        var completedTaskFromApi = await GetFromJson<TaskResponseDto>($"/api/tasks/{task.Id}");
        Assert.NotNull(completedTaskFromApi);
        Assert.Equal("Completed", completedTaskFromApi.Status);

        var workerProfile = await GetFromJson<WorkerResponseDto>($"/api/workers/{worker.Id}");
        Assert.NotNull(workerProfile);
        Assert.Equal("Namal Rajapakse", workerProfile.FullName);
    }

    [Fact]
    public async Task WorkerReassignment_UpdatesPreviousAssignmentStatusToReassigned()
    {
        // 1. Setup Farm & Field
        var farm = await (await PostAsJson("/api/farm", new CreateFarmDto
        {
            Name = "Reassign Farm",
            Location = "Zone R",
            TotalArea = 10.0m,
            OwnerId = Guid.NewGuid()
        })).Content.ReadFromJsonAsync<FarmDto>(JsonOptions);

        var field = await (await PostAsJson("/api/field", new CreateFieldDto
        {
            FarmId = farm!.Id,
            FieldName = "F-Reassign",
            AreaSize = 5.0m,
            SoilType = "Loamy"
        })).Content.ReadFromJsonAsync<FieldDto>(JsonOptions);

        // 2. Setup Worker 1 & Worker 2
        var w1 = await (await PostAsJson("/api/workers", new CreateWorkerDto(Guid.NewGuid(), "Worker One", "+94711110001", "FullTime")))
            .Content.ReadFromJsonAsync<WorkerResponseDto>(JsonOptions);
        var w2 = await (await PostAsJson("/api/workers", new CreateWorkerDto(Guid.NewGuid(), "Worker Two", "+94711110002", "FullTime")))
            .Content.ReadFromJsonAsync<WorkerResponseDto>(JsonOptions);

        // 3. Create Task
        var task = await (await PostAsJson("/api/tasks", new CreateTaskDto(
            FieldId: field!.Id,
            CropSeasonId: null,
            Title: "Drip Pipe Repair",
            TaskType: "Watering",
            Priority: "Medium",
            Description: "Repair cracked lateral line",
            TargetDate: DateTime.UtcNow.AddDays(1)
        ))).Content.ReadFromJsonAsync<TaskResponseDto>(JsonOptions);

        // 4. Assign Worker 1
        var assign1Resp = await PostAsJson($"/api/tasks/{task!.Id}/assign", new AssignWorkerDto(w1!.Id));
        Assert.Equal(HttpStatusCode.OK, assign1Resp.StatusCode);

        // 5. Reassign to Worker 2
        var assign2Resp = await PostAsJson($"/api/tasks/{task.Id}/assign", new AssignWorkerDto(w2!.Id));
        Assert.Equal(HttpStatusCode.OK, assign2Resp.StatusCode);

        // 6. Direct Database Verification
        await using var db = CreateDbContext();
        var assignments = await db.TaskAssignments
            .Where(a => a.TaskId == task.Id)
            .OrderBy(a => a.AssignedDate)
            .ToListAsync();

        Assert.Equal(2, assignments.Count);

        var firstAssignment = assignments.First(a => a.WorkerId == w1.Id);
        var secondAssignment = assignments.First(a => a.WorkerId == w2.Id);

        Assert.Equal("Reassigned", firstAssignment.Status);
        Assert.Equal("Active", secondAssignment.Status);
    }
}
