using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using AgriOps.Api.Controllers;
using AgriOps.Api.Dtos;
using AgriOps.Core.Entities;
using AgriOps.Tests.Helpers;
using Xunit;

namespace AgriOps.Tests.Component2.Controllers;

public class CropAnalysisControllerTests
{
    private readonly FakeCropAnalysisService _fakeService;
    private readonly CropAnalysisController _controller;

    public CropAnalysisControllerTests()
    {
        _fakeService = new FakeCropAnalysisService();
        _controller = new CropAnalysisController(_fakeService);
    }

    [Fact]
    public async Task SubmitAssessment_WhenValid_ReturnsCreatedAtAction()
    {
        var fieldId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var request = new SubmitCropAnalysisRequestDto(
            FieldId: fieldId,
            CropVariety: "Tomato",
            GrowthStage: "Vegetative",
            ObservationText: "Yellowing on leaf veins observed.",
            ImageUrl: "https://cdn.agriops.io/scans/sample1.jpg",
            SubmittedByUserId: userId
        );

        var result = await _controller.SubmitCropAnalysis(request);

        var createdResult = Assert.IsType<CreatedAtActionResult>(result.Result);
        var responseDto = Assert.IsType<CropAnalysisAssessmentResponseDto>(createdResult.Value);
        Assert.Equal(fieldId, responseDto.FieldId);
        Assert.Equal("PendingReview", responseDto.Status);
    }

    [Fact]
    public async Task ApproveAssessment_ValidId_ApprovesAndGeneratesRemediationFarmTask()
    {
        var assessment = TestDataBuilder.CreateAssessment(Guid.NewGuid(), suggestedTaskType: "PesticideApplication", priority: "Critical");
        _fakeService.Assessments.Add(assessment);

        var managerId = Guid.NewGuid();
        var approveRequest = new ApproveAssessmentRequestDto(
            ManagerUserId: managerId,
            Comments: "Foliar copper hydroxide application approved."
        );

        var result = await _controller.ApproveAssessment(assessment.Id, approveRequest);

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var taskDto = Assert.IsType<TaskResponseDto>(okResult.Value);
        Assert.Equal("Approved", assessment.Status);
        Assert.Equal("PesticideApplication", taskDto.TaskType);
        Assert.Equal("Critical", taskDto.Priority);
        Assert.Equal("Pending", taskDto.Status);
    }

    [Fact]
    public async Task RejectAssessment_ValidId_MarksRejectedAndReturnsOk()
    {
        var assessment = TestDataBuilder.CreateAssessment(Guid.NewGuid());
        _fakeService.Assessments.Add(assessment);

        var managerId = Guid.NewGuid();
        var rejectRequest = new RejectAssessmentRequestDto(
            ManagerUserId: managerId,
            Comments: "Symptoms appear to be normal sun scalding, not fungal infection."
        );

        var result = await _controller.RejectAssessment(assessment.Id, rejectRequest);

        Assert.IsType<NoContentResult>(result);
        Assert.Equal("Rejected", assessment.Status);
    }
}
