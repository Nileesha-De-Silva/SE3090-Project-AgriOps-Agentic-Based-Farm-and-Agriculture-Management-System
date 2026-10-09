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

public class CropAnalysisGateTests : IntegrationTestBase
{
    public CropAnalysisGateTests(AgriOpsTestHost host) : base(host)
    {
    }

    [Fact]
    public async Task SubmitCropAnalysis_PlacesAssessmentInPendingGatekeeperQueue()
    {
        // 1. Setup Farm & Field in Component 1
        var farm = await (await PostAsJson("/api/farm", new CreateFarmDto
        {
            Name = "Orchard Valley",
            Location = "Zone A",
            TotalArea = 40.0m,
            OwnerId = Guid.NewGuid()
        })).Content.ReadFromJsonAsync<FarmDto>(JsonOptions);

        var field = await (await PostAsJson("/api/field", new CreateFieldDto
        {
            FarmId = farm!.Id,
            FieldName = "Block 7 - Apple Trees",
            AreaSize = 15.0m,
            SoilType = "ClayLoam"
        })).Content.ReadFromJsonAsync<FieldDto>(JsonOptions);

        // 2. Mobile/Scouting App submits crop analysis request
        var requestDto = new SubmitCropAnalysisRequestDto(
            FieldId: field!.Id,
            CropVariety: "Gala Apple",
            GrowthStage: "Fruiting",
            ObservationText: "Dark circular lesions observed on leaf undersides, potential Apple Scab",
            ImageUrl: "https://storage.agriops.local/scouts/obs-101.jpg",
            SubmittedByUserId: Guid.NewGuid()
        );

        var postResponse = await PostAsJson("/api/cropanalysis", requestDto);
        Assert.Equal(HttpStatusCode.Created, postResponse.StatusCode);

        var assessment = await postResponse.Content.ReadFromJsonAsync<CropAnalysisAssessmentResponseDto>(JsonOptions);
        Assert.NotNull(assessment);
        Assert.Equal(field.Id, assessment.FieldId);
        Assert.Equal("PendingApproval", assessment.Status);

        // 3. Query pending approvals queue
        var pendingResponse = await Client.GetAsync("/api/cropanalysis/pending");
        Assert.Equal(HttpStatusCode.OK, pendingResponse.StatusCode);

        var pendingList = await pendingResponse.Content.ReadFromJsonAsync<List<CropAnalysisAssessmentResponseDto>>(JsonOptions);
        Assert.NotNull(pendingList);
        Assert.Contains(pendingList, a => a.Id == assessment.Id);
    }

    [Fact]
    public async Task ApproveAssessment_UpdatesStatusAndAutomaticallyProvisionsRemediationFarmTask()
    {
        // 1. Setup Farm & Field
        var farm = await (await PostAsJson("/api/farm", new CreateFarmDto
        {
            Name = "Vineyard Estate",
            Location = "Zone V",
            TotalArea = 60.0m,
            OwnerId = Guid.NewGuid()
        })).Content.ReadFromJsonAsync<FarmDto>(JsonOptions);

        var field = await (await PostAsJson("/api/field", new CreateFieldDto
        {
            FarmId = farm!.Id,
            FieldName = "Vine Block 3",
            AreaSize = 12.0m,
            SoilType = "SandyLoam"
        })).Content.ReadFromJsonAsync<FieldDto>(JsonOptions);

        // 2. Submit AI Assessment
        var requestDto = new SubmitCropAnalysisRequestDto(
            FieldId: field!.Id,
            CropVariety: "Cabernet Sauvignon",
            GrowthStage: "Flowering",
            ObservationText: "Powdery mildew outbreak detected along row 4",
            ImageUrl: "https://storage.agriops.local/scouts/grape-mildew.jpg",
            SubmittedByUserId: Guid.NewGuid()
        );

        var submitResp = await PostAsJson("/api/cropanalysis", requestDto);
        var assessment = await submitResp.Content.ReadFromJsonAsync<CropAnalysisAssessmentResponseDto>(JsonOptions);
        Assert.NotNull(assessment);

        // 3. Farm Manager Approves the Assessment
        var managerId = Guid.NewGuid();
        var approveDto = new ApproveAssessmentRequestDto(
            ManagerUserId: managerId,
            Comments: "Approved. Deploy chemical remediation spray team immediately."
        );

        var approveResponse = await PostAsJson($"/api/cropanalysis/{assessment.Id}/approve", approveDto);
        Assert.Equal(HttpStatusCode.OK, approveResponse.StatusCode);

        var generatedTask = await approveResponse.Content.ReadFromJsonAsync<TaskResponseDto>(JsonOptions);
        Assert.NotNull(generatedTask);

        // Integrated Cross-Component Assertions:
        Assert.Equal(field.Id, generatedTask.FieldId);
        Assert.Equal(assessment.SuggestedTaskType, generatedTask.TaskType);
        Assert.Equal(assessment.Priority, generatedTask.Priority);
        Assert.Equal("Pending", generatedTask.Status);

        // 4. Verify Task is retrievable via TasksController
        var getTaskResp = await Client.GetAsync($"/api/tasks/{generatedTask.Id}");
        Assert.Equal(HttpStatusCode.OK, getTaskResp.StatusCode);

        // 5. Directly verify Database state: Assessment marked Approved and ApprovalItem created
        await using var db = CreateDbContext();
        var dbAssessment = await db.CropAnalysisAssessments.FindAsync(assessment.Id);
        Assert.NotNull(dbAssessment);
        Assert.Equal("Approved", dbAssessment.Status);

        var approvalItem = await db.ApprovalItems.FirstOrDefaultAsync(a => a.WorkflowId == assessment.WorkflowId);
        Assert.NotNull(approvalItem);
        Assert.Equal("Approved", approvalItem.Status);
        Assert.Equal(managerId, approvalItem.ReviewedByUserId);
    }

    [Fact]
    public async Task RejectAssessment_MarksStatusRejectedWithoutCreatingFarmTask()
    {
        // Setup Farm & Field
        var farm = await (await PostAsJson("/api/farm", new CreateFarmDto
        {
            Name = "Citrus Grove",
            Location = "Zone C",
            TotalArea = 25.0m,
            OwnerId = Guid.NewGuid()
        })).Content.ReadFromJsonAsync<FarmDto>(JsonOptions);

        var field = await (await PostAsJson("/api/field", new CreateFieldDto
        {
            FarmId = farm!.Id,
            FieldName = "Orange Plot 1",
            AreaSize = 10.0m,
            SoilType = "Loamy"
        })).Content.ReadFromJsonAsync<FieldDto>(JsonOptions);

        // Submit Assessment
        var submitResp = await PostAsJson("/api/cropanalysis", new SubmitCropAnalysisRequestDto(
            FieldId: field!.Id,
            CropVariety: "Valencia Orange",
            GrowthStage: "Vegetative",
            ObservationText: "Minor cosmetic leaf spots",
            ImageUrl: "https://storage.agriops.local/scouts/citrus1.jpg",
            SubmittedByUserId: Guid.NewGuid()
        ));
        var assessment = await submitResp.Content.ReadFromJsonAsync<CropAnalysisAssessmentResponseDto>(JsonOptions);
        Assert.NotNull(assessment);

        // Manager Rejects Assessment
        var rejectDto = new RejectAssessmentRequestDto(
            ManagerUserId: Guid.NewGuid(),
            Comments: "Harmless sun scald, no treatment required."
        );

        var rejectResponse = await PostAsJson($"/api/cropanalysis/{assessment.Id}/reject", rejectDto);
        Assert.Equal(HttpStatusCode.NoContent, rejectResponse.StatusCode);

        // Verify Database state
        await using var db = CreateDbContext();
        var dbAssessment = await db.CropAnalysisAssessments.FindAsync(assessment.Id);
        Assert.NotNull(dbAssessment);
        Assert.Equal("Rejected", dbAssessment.Status);

        // Ensure NO task was created
        var taskExists = await db.Tasks.AnyAsync(t => t.FieldId == field.Id);
        Assert.False(taskExists);

        // Ensure not in pending queue
        var pendingList = await GetFromJson<List<CropAnalysisAssessmentResponseDto>>("/api/cropanalysis/pending");
        Assert.NotNull(pendingList);
        Assert.DoesNotContain(pendingList, a => a.Id == assessment.Id);
    }
}
