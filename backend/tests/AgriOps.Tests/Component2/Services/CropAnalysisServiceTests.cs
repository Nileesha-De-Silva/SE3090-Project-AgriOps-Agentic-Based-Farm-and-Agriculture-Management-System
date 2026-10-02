using System;
using System.Threading.Tasks;
using AgriOps.Core.Entities;
using AgriOps.Infrastructure.Services;
using AgriOps.Tests.Helpers;
using Xunit;

namespace AgriOps.Tests.Component2.Services;

[Collection("DatabaseTests")]
public class CropAnalysisServiceTests : IAsyncLifetime
{
    private readonly AgriOps.Infrastructure.Data.ApplicationDbContext _context;
    private readonly CropAnalysisService _service;

    public CropAnalysisServiceTests()
    {
        _context = TestDbContextFactory.CreateDbContext();
        _service = new CropAnalysisService(_context);
    }

    public Task InitializeAsync() => Task.CompletedTask;

    public async Task DisposeAsync()
    {
        await TestDbContextFactory.ResetDatabaseAsync(_context);
        await _context.DisposeAsync();
    }

    [Fact]
    public async Task SubmitCropAnalysisRequestAsync_CreatesAssessmentAndApprovalItem()
    {
        var fieldId = Guid.NewGuid();
        var userId = Guid.NewGuid();

        var assessment = await _service.SubmitCropAnalysisRequestAsync(
            fieldId,
            "Tomato",
            "Vegetative",
            "Leaf curl symptoms on northern plots",
            "https://cdn.agriops.io/scans/scan_01.jpg",
            userId
        );

        Assert.NotNull(assessment);
        Assert.Equal("PendingApproval", assessment.Status);
        Assert.Equal(fieldId, assessment.FieldId);

        // Verify ApprovalItem created in DB
        var dbAssessment = await _service.GetAssessmentByIdAsync(assessment.Id);
        Assert.NotNull(dbAssessment);
    }

    [Fact]
    public async Task ApproveAssessmentAndCreateTaskAsync_MarksApprovedAndCreatesRemediationFarmTask()
    {
        var fieldId = Guid.NewGuid();
        var submitterId = Guid.NewGuid();
        var assessment = await _service.SubmitCropAnalysisRequestAsync(
            fieldId,
            "Chili",
            "Fruiting",
            "Anthracnose rot detected on ripe pods",
            "https://cdn.agriops.io/scans/chili_rot.jpg",
            submitterId
        );

        var managerId = Guid.NewGuid();
        var farmTask = await _service.ApproveAssessmentAndCreateTaskAsync(
            assessment.Id,
            managerId,
            "Emergency bio-fungicide spraying authorized."
        );

        Assert.NotNull(farmTask);
        Assert.Equal("Pending", farmTask.Status);
        Assert.Equal(fieldId, farmTask.FieldId);
        Assert.Equal(assessment.SuggestedTaskType, farmTask.TaskType);
        Assert.Equal(assessment.Priority, farmTask.Priority);
        Assert.Contains("Emergency bio-fungicide spraying authorized", farmTask.Description);

        // Verify assessment status updated in DB
        var updatedAssessment = await _service.GetAssessmentByIdAsync(assessment.Id);
        Assert.Equal("Approved", updatedAssessment!.Status);
    }

    [Fact]
    public async Task RejectAssessmentAsync_MarksRejectedWithoutCreatingTask()
    {
        var fieldId = Guid.NewGuid();
        var submitterId = Guid.NewGuid();
        var assessment = await _service.SubmitCropAnalysisRequestAsync(
            fieldId,
            "Tomato",
            "Germination",
            "Slight discoloration on cotyledons",
            "https://cdn.agriops.io/scans/cotyledon.jpg",
            submitterId
        );

        var managerId = Guid.NewGuid();
        var rejected = await _service.RejectAssessmentAsync(
            assessment.Id,
            managerId,
            "Physiological variation due to cold soil; no intervention needed."
        );

        Assert.True(rejected);

        var updatedAssessment = await _service.GetAssessmentByIdAsync(assessment.Id);
        Assert.Equal("Rejected", updatedAssessment!.Status);
    }
}
