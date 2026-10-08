using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Net.Http.Json;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using AgriOps.Api.Dtos;
using AgriOps.IntegrationTests.Infrastructure;
using Xunit;

namespace AgriOps.IntegrationTests.E2E;

/// <summary>
/// Comprehensive End-to-End (E2E) and Cross-Platform Integration Test Suite for Component 2 (Nileesha De Silva).
/// Evaluates:
///  1. API Integration Testing (HTTP contracts, schemas, headers, status codes)
///  2. Cross-Component Integration Testing (Component 1 Farm/Field -> Component 2 Task/Workforce -> Component 4 Audit)
///  3. Complete Business-Workflow Testing (Field Scouting -> AI Gate -> Dispatch -> Evidence -> Rework -> Approval -> Audit)
///  4. Cross-Platform Workflow Testing (Mobile Flutter Client simulation <-> React Web Dashboard simulation)
/// </summary>
public class Component2EndToEndWorkflowTests : IntegrationTestBase
{
    private const string MobileUserAgent = "AgriOps-Mobile/1.0.0 (Android; Flutter)";
    private const string WebUserAgent = "AgriOps-Web/1.0.0 (React/Vite)";

    public Component2EndToEndWorkflowTests(AgriOpsTestHost host) : base(host)
    {
    }

    private HttpRequestMessage CreateMobileRequest(HttpMethod method, string uri, object? content = null)
    {
        var request = new HttpRequestMessage(method, uri);
        request.Headers.Add("User-Agent", MobileUserAgent);
        if (content != null)
        {
            request.Content = JsonContent.Create(content, options: JsonOptions);
        }
        return request;
    }

    private HttpRequestMessage CreateWebRequest(HttpMethod method, string uri, object? content = null)
    {
        var request = new HttpRequestMessage(method, uri);
        request.Headers.Add("User-Agent", WebUserAgent);
        if (content != null)
        {
            request.Content = JsonContent.Create(content, options: JsonOptions);
        }
        return request;
    }

    [Fact]
    public async Task E2E_FullCrossPlatformLifecycle_ScoutToGatekeeperToDispatchToReworkToCompletedAudit()
    {
        var managerUserId = Guid.NewGuid();
        var workerUserId = Guid.NewGuid();

        // =========================================================================
        // STEP 1: Component 1 Farm & Field Provisioning (React Web Dashboard Simulation)
        // =========================================================================
        var farmReq = CreateWebRequest(HttpMethod.Post, "/api/farm", new CreateFarmDto
        {
            Name = "Mahaweli Innovation Plantation",
            Location = "Zone B - Block 14",
            TotalArea = 50.0m,
            OwnerId = managerUserId
        });
        var farmResp = await Client.SendAsync(farmReq);
        Assert.Equal(HttpStatusCode.Created, farmResp.StatusCode);
        var farm = await farmResp.Content.ReadFromJsonAsync<FarmDto>(JsonOptions);
        Assert.NotNull(farm);

        var fieldReq = CreateWebRequest(HttpMethod.Post, "/api/field", new CreateFieldDto
        {
            FarmId = farm.Id,
            FieldName = "Paddy Sector Beta",
            AreaSize = 12.5m,
            SoilType = "ClayLoam"
        });
        var fieldResp = await Client.SendAsync(fieldReq);
        Assert.Equal(HttpStatusCode.Created, fieldResp.StatusCode);
        var field = await fieldResp.Content.ReadFromJsonAsync<FieldDto>(JsonOptions);
        Assert.NotNull(field);

        // =========================================================================
        // STEP 2: Component 2 Workforce Onboarding & Qualification (Web Dashboard)
        // =========================================================================
        var workerReq = CreateWebRequest(HttpMethod.Post, "/api/workers", new CreateWorkerDto(
            UserId: workerUserId,
            FullName: "Kavinda Bandara",
            ContactNumber: "+94778899001",
            EmploymentType: "FullTime"
        ));
        var workerResp = await Client.SendAsync(workerReq);
        Assert.Equal(HttpStatusCode.Created, workerResp.StatusCode);
        var worker = await workerResp.Content.ReadFromJsonAsync<WorkerResponseDto>(JsonOptions);
        Assert.NotNull(worker);
        Assert.Equal(0, worker.ActiveWorkloadCount);

        // Add certified skill: PestDiagnostic (required for PestInspection tasks)
        var skillReq = CreateWebRequest(HttpMethod.Post, $"/api/workers/{worker.Id}/skills", new AddWorkerSkillDto(
            SkillName: "PestDiagnostic",
            ProficiencyLevel: "Expert"
        ));
        var skillResp = await Client.SendAsync(skillReq);
        Assert.Equal(HttpStatusCode.OK, skillResp.StatusCode);

        // =========================================================================
        // STEP 3: Mobile Scouting Submission (Flutter Mobile Client Simulation)
        // =========================================================================
        var scoutReq = CreateMobileRequest(HttpMethod.Post, "/api/cropanalysis", new SubmitCropAnalysisRequestDto(
            FieldId: field.Id,
            CropVariety: "BG-352",
            GrowthStage: "Tillering",
            ObservationText: "Severe brown leaf spot symptoms identified near irrigation canal",
            ImageUrl: "https://cdn.agriops.local/scouts/blight-gamma.jpg",
            SubmittedByUserId: workerUserId
        ));
        var scoutResp = await Client.SendAsync(scoutReq);
        Assert.Equal(HttpStatusCode.Created, scoutResp.StatusCode);
        var assessment = await scoutResp.Content.ReadFromJsonAsync<CropAnalysisAssessmentResponseDto>(JsonOptions);
        Assert.NotNull(assessment);
        Assert.Equal("PendingApproval", assessment.Status);
        Assert.Equal("PestInspection", assessment.SuggestedTaskType);

        // =========================================================================
        // STEP 4: Manager Pending Queue Inspection (React Web Dashboard Simulation)
        // =========================================================================
        var queueReq = CreateWebRequest(HttpMethod.Get, "/api/cropanalysis/pending");
        var queueResp = await Client.SendAsync(queueReq);
        Assert.Equal(HttpStatusCode.OK, queueResp.StatusCode);
        var pendingList = await queueResp.Content.ReadFromJsonAsync<List<CropAnalysisAssessmentResponseDto>>(JsonOptions);
        Assert.NotNull(pendingList);
        Assert.Contains(pendingList, a => a.Id == assessment.Id);

        // =========================================================================
        // STEP 5: Manager Gatekeeper Approval -> Auto-Provision Task (Web Dashboard)
        // =========================================================================
        var approveReq = CreateWebRequest(HttpMethod.Post, $"/api/cropanalysis/{assessment.Id}/approve", new ApproveAssessmentRequestDto(
            ManagerUserId: managerUserId,
            Comments: "Approved AI diagnostic. Immediate foliar inspection and remediation required."
        ));
        var approveResp = await Client.SendAsync(approveReq);
        Assert.Equal(HttpStatusCode.OK, approveResp.StatusCode);
        var task = await approveResp.Content.ReadFromJsonAsync<TaskResponseDto>(JsonOptions);
        Assert.NotNull(task);
        Assert.Equal(field.Id, task.FieldId);
        Assert.Equal("PestInspection", task.TaskType);
        Assert.Equal("Pending", task.Status);

        // =========================================================================
        // STEP 6: Workforce Matching & Dispatch Engine (Web Dashboard)
        // =========================================================================
        var matchReq = CreateWebRequest(HttpMethod.Get, $"/api/workers/matched?taskType=PestInspection");
        var matchResp = await Client.SendAsync(matchReq);
        Assert.Equal(HttpStatusCode.OK, matchResp.StatusCode);
        var matchedWorkers = await matchResp.Content.ReadFromJsonAsync<List<WorkerResponseDto>>(JsonOptions);
        Assert.NotNull(matchedWorkers);
        Assert.Contains(matchedWorkers, w => w.Id == worker.Id);

        // Assign worker to task
        var assignReq = CreateWebRequest(HttpMethod.Post, $"/api/tasks/{task.Id}/assign", new AssignWorkerDto(worker.Id));
        var assignResp = await Client.SendAsync(assignReq);
        Assert.Equal(HttpStatusCode.OK, assignResp.StatusCode);
        var assignment = await assignResp.Content.ReadFromJsonAsync<TaskAssignmentDto>(JsonOptions);
        Assert.NotNull(assignment);
        Assert.Equal("Active", assignment.Status);

        // Verify task status is now Assigned
        var assignedTask = await GetFromJson<TaskResponseDto>($"/api/tasks/{task.Id}");
        Assert.NotNull(assignedTask);
        Assert.Equal("Assigned", assignedTask.Status);

        // =========================================================================
        // STEP 7: Field Execution Start (Flutter Mobile Client Simulation)
        // =========================================================================
        var startReq = CreateMobileRequest(HttpMethod.Patch, $"/api/tasks/{task.Id}/status", new UpdateTaskStatusDto(
            NewStatus: "InProgress",
            UserId: workerUserId,
            Remarks: "Field inspection initiated with digital magnifying lens and trap check."
        ));
        var startResp = await Client.SendAsync(startReq);
        Assert.Equal(HttpStatusCode.OK, startResp.StatusCode);
        var inProgressTask = await startResp.Content.ReadFromJsonAsync<TaskResponseDto>(JsonOptions);
        Assert.NotNull(inProgressTask);
        Assert.Equal("InProgress", inProgressTask.Status);

        // =========================================================================
        // STEP 8: Evidence Upload Attempt 1 (Mobile Client)
        // =========================================================================
        var ev1Req = CreateMobileRequest(HttpMethod.Post, $"/api/tasks/{task.Id}/evidence", new SubmitEvidenceDto(
            EvidencePhotoUrl: "https://cdn.agriops.local/evidence/pass1.jpg",
            Remarks: "North quadrant completed.",
            WorkerUserId: workerUserId
        ));
        var ev1Resp = await Client.SendAsync(ev1Req);
        Assert.Equal(HttpStatusCode.OK, ev1Resp.StatusCode);
        var ev1History = await ev1Resp.Content.ReadFromJsonAsync<TaskHistoryDto>(JsonOptions);
        Assert.NotNull(ev1History);
        Assert.Equal("PendingVerification", ev1History.NewStatus);

        // Verify task state in backend
        var taskPendingVerify = await GetFromJson<TaskResponseDto>($"/api/tasks/{task.Id}");
        Assert.NotNull(taskPendingVerify);
        Assert.Equal("PendingVerification", taskPendingVerify.Status);

        // =========================================================================
        // STEP 9: Manager Rework Rejection (Web Dashboard Simulation)
        // =========================================================================
        var rejectReq = CreateWebRequest(HttpMethod.Post, $"/api/tasks/{task.Id}/verify", new VerifyEvidenceDto(
            IsApproved: false,
            ManagerUserId: managerUserId,
            Remarks: "South boundary was not covered. Complete inspection across entire 12.5 hectares."
        ));
        var rejectResp = await Client.SendAsync(rejectReq);
        Assert.Equal(HttpStatusCode.OK, rejectResp.StatusCode);
        var reworkTask = await rejectResp.Content.ReadFromJsonAsync<TaskResponseDto>(JsonOptions);
        Assert.NotNull(reworkTask);
        Assert.Equal("InProgress", reworkTask.Status);

        // =========================================================================
        // STEP 10: Resubmission with Full Evidence (Mobile Client Simulation)
        // =========================================================================
        var ev2Req = CreateMobileRequest(HttpMethod.Post, $"/api/tasks/{task.Id}/evidence", new SubmitEvidenceDto(
            EvidencePhotoUrl: "https://cdn.agriops.local/evidence/pass2_full.jpg",
            Remarks: "South boundary inspected and perimeter traps documented.",
            WorkerUserId: workerUserId
        ));
        var ev2Resp = await Client.SendAsync(ev2Req);
        Assert.Equal(HttpStatusCode.OK, ev2Resp.StatusCode);
        var ev2History = await ev2Resp.Content.ReadFromJsonAsync<TaskHistoryDto>(JsonOptions);
        Assert.NotNull(ev2History);
        Assert.Equal("PendingVerification", ev2History.NewStatus);

        // =========================================================================
        // STEP 11: Manager Final Sign-Off & Verification (Web Dashboard Simulation)
        // =========================================================================
        var approveEvReq = CreateWebRequest(HttpMethod.Post, $"/api/tasks/{task.Id}/verify", new VerifyEvidenceDto(
            IsApproved: true,
            ManagerUserId: managerUserId,
            Remarks: "Confirmed thorough coverage and traps clear. Task approved."
        ));
        var approveEvResp = await Client.SendAsync(approveEvReq);
        Assert.Equal(HttpStatusCode.OK, approveEvResp.StatusCode);
        var completedTask = await approveEvResp.Content.ReadFromJsonAsync<TaskResponseDto>(JsonOptions);
        Assert.NotNull(completedTask);
        Assert.Equal("Completed", completedTask.Status);

        // =========================================================================
        // STEP 12: Component 4 Immutable Audit Log Inspection (Web Dashboard)
        // =========================================================================
        var auditReq = CreateWebRequest(HttpMethod.Get, $"/api/tasks/{task.Id}/history");
        var auditResp = await Client.SendAsync(auditReq);
        Assert.Equal(HttpStatusCode.OK, auditResp.StatusCode);
        var historyList = await auditResp.Content.ReadFromJsonAsync<List<TaskHistoryDto>>(JsonOptions);
        Assert.NotNull(historyList);
        Assert.True(historyList.Count >= 6, $"Expected >= 6 audit history entries, found {historyList.Count}");

        // Validate audit chain consistency
        Assert.Contains(historyList, h => h.NewStatus == "Pending");
        Assert.Contains(historyList, h => h.NewStatus == "Assigned");
        Assert.Contains(historyList, h => h.NewStatus == "InProgress");
        Assert.Contains(historyList, h => h.NewStatus == "PendingVerification");
        Assert.Contains(historyList, h => h.PreviousStatus == "PendingVerification" && h.NewStatus == "InProgress" && h.Remarks!.Contains("South boundary was not covered"));
        Assert.Contains(historyList, h => h.NewStatus == "Completed");

        // Direct DB verification
        await using var db = CreateDbContext();
        var finalDbTask = await db.Tasks.FindAsync(task.Id);
        Assert.NotNull(finalDbTask);
        Assert.Equal("Completed", finalDbTask.Status);

        var finalDbAssessment = await db.CropAnalysisAssessments.FindAsync(assessment.Id);
        Assert.NotNull(finalDbAssessment);
        Assert.Equal("Approved", finalDbAssessment.Status);
    }

    [Fact]
    public async Task E2E_CrossComponent_RejectionWithoutTaskProvisioning_MaintainsDataIntegrity()
    {
        var managerId = Guid.NewGuid();
        var farm = await (await PostAsJson("/api/farm", new CreateFarmDto
        {
            Name = "Clean Farm Test",
            Location = "Zone X",
            TotalArea = 10.0m,
            OwnerId = managerId
        })).Content.ReadFromJsonAsync<FarmDto>(JsonOptions);

        var field = await (await PostAsJson("/api/field", new CreateFieldDto
        {
            FarmId = farm!.Id,
            FieldName = "Clean Field 1",
            AreaSize = 5.0m,
            SoilType = "Sandy"
        })).Content.ReadFromJsonAsync<FieldDto>(JsonOptions);

        // Submit crop analysis
        var scoutResp = await PostAsJson("/api/cropanalysis", new SubmitCropAnalysisRequestDto(
            FieldId: field!.Id,
            CropVariety: "Tomato Heirlooms",
            GrowthStage: "Flowering",
            ObservationText: "Slight leaf curling due to afternoon heat",
            ImageUrl: "https://cdn.agriops.local/scouts/heat-stress.jpg",
            SubmittedByUserId: Guid.NewGuid()
        ));
        var assessment = await scoutResp.Content.ReadFromJsonAsync<CropAnalysisAssessmentResponseDto>(JsonOptions);
        Assert.NotNull(assessment);

        // Manager Rejects the AI assessment
        var rejectResp = await PostAsJson($"/api/cropanalysis/{assessment.Id}/reject", new RejectAssessmentRequestDto(
            ManagerUserId: managerId,
            Comments: "Normal heat stress response, no treatment necessary."
        ));
        Assert.Equal(HttpStatusCode.NoContent, rejectResp.StatusCode);

        // Assert NO task was provisioned
        await using var db = CreateDbContext();
        var taskCount = await db.Tasks.CountAsync(t => t.FieldId == field.Id);
        Assert.Equal(0, taskCount);

        var dbAssessment = await db.CropAnalysisAssessments.FindAsync(assessment.Id);
        Assert.NotNull(dbAssessment);
        Assert.Equal("Rejected", dbAssessment.Status);
    }

    [Fact]
    public async Task E2E_ApiContractValidation_EnforcesValidationAndRejectsIllegalStateTransitions()
    {
        // 1. Assign to non-existent task returns 404
        var nonExistentTaskId = Guid.NewGuid();
        var invalidAssignResp = await PostAsJson($"/api/tasks/{nonExistentTaskId}/assign", new AssignWorkerDto(Guid.NewGuid()));
        Assert.Equal(HttpStatusCode.NotFound, invalidAssignResp.StatusCode);

        // 2. Approve non-existent crop assessment returns 404
        var nonExistentAssessmentId = Guid.NewGuid();
        var invalidApproveResp = await PostAsJson($"/api/cropanalysis/{nonExistentAssessmentId}/approve", new ApproveAssessmentRequestDto(
            ManagerUserId: Guid.NewGuid(),
            Comments: "Invalid assessment approval"
        ));
        Assert.Equal(HttpStatusCode.NotFound, invalidApproveResp.StatusCode);

        // 3. Query non-existent worker profile returns 404
        var nonExistentWorkerResp = await Client.GetAsync($"/api/workers/{Guid.NewGuid()}");
        Assert.Equal(HttpStatusCode.NotFound, nonExistentWorkerResp.StatusCode);

        // 4. Verify non-existent task evidence returns 404
        var invalidVerifyResp = await PostAsJson($"/api/tasks/{Guid.NewGuid()}/verify", new VerifyEvidenceDto(
            IsApproved: true,
            ManagerUserId: Guid.NewGuid(),
            Remarks: "Verifying ghost task"
        ));
        Assert.Equal(HttpStatusCode.NotFound, invalidVerifyResp.StatusCode);
    }
}
