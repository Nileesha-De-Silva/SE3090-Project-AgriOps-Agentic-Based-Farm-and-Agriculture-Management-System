using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using AgriOps.Api.Dtos;
using AgriOps.Core.Interfaces;

namespace AgriOps.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CropAnalysisController : ControllerBase
{
    private readonly ICropAnalysisService _cropAnalysisService;

    public CropAnalysisController(ICropAnalysisService cropAnalysisService)
    {
        _cropAnalysisService = cropAnalysisService;
    }

    /// <summary>
    /// Submit crop symptom observations and photos for AI analysis assessment.
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<CropAnalysisAssessmentResponseDto>> SubmitCropAnalysis([FromBody] SubmitCropAnalysisRequestDto request)
    {
        var assessment = await _cropAnalysisService.SubmitCropAnalysisRequestAsync(
            request.FieldId,
            request.CropVariety,
            request.GrowthStage,
            request.ObservationText,
            request.ImageUrl,
            request.SubmittedByUserId
        );

        var response = new CropAnalysisAssessmentResponseDto(
            assessment.Id,
            assessment.WorkflowId,
            assessment.FieldId,
            assessment.CropVariety,
            assessment.GrowthStage,
            assessment.ObservationText,
            assessment.ImageUrl,
            assessment.PrimaryIndicator,
            assessment.PotentialStressFactorsJson,
            assessment.RiskLevel,
            assessment.RecommendedActionsJson,
            assessment.SuggestedTaskType,
            assessment.Priority,
            assessment.Status,
            assessment.SubmittedByUserId,
            assessment.CreatedAt
        );

        return CreatedAtAction(nameof(GetAssessmentById), new { id = assessment.Id }, response);
    }

    /// <summary>
    /// Get a single crop analysis assessment by ID.
    /// </summary>
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<CropAnalysisAssessmentResponseDto>> GetAssessmentById(Guid id)
    {
        var assessment = await _cropAnalysisService.GetAssessmentByIdAsync(id);
        if (assessment == null)
        {
            return NotFound($"Crop analysis assessment with ID '{id}' not found.");
        }

        var response = new CropAnalysisAssessmentResponseDto(
            assessment.Id,
            assessment.WorkflowId,
            assessment.FieldId,
            assessment.CropVariety,
            assessment.GrowthStage,
            assessment.ObservationText,
            assessment.ImageUrl,
            assessment.PrimaryIndicator,
            assessment.PotentialStressFactorsJson,
            assessment.RiskLevel,
            assessment.RecommendedActionsJson,
            assessment.SuggestedTaskType,
            assessment.Priority,
            assessment.Status,
            assessment.SubmittedByUserId,
            assessment.CreatedAt
        );

        return Ok(response);
    }

    /// <summary>
    /// Get all pending crop analysis assessments awaiting farm manager approval.
    /// </summary>
    [HttpGet("pending")]
    public async Task<ActionResult<IEnumerable<CropAnalysisAssessmentResponseDto>>> GetPendingApprovals()
    {
        var assessments = await _cropAnalysisService.GetPendingApprovalsAsync();
        var dtos = assessments.Select(assessment => new CropAnalysisAssessmentResponseDto(
            assessment.Id,
            assessment.WorkflowId,
            assessment.FieldId,
            assessment.CropVariety,
            assessment.GrowthStage,
            assessment.ObservationText,
            assessment.ImageUrl,
            assessment.PrimaryIndicator,
            assessment.PotentialStressFactorsJson,
            assessment.RiskLevel,
            assessment.RecommendedActionsJson,
            assessment.SuggestedTaskType,
            assessment.Priority,
            assessment.Status,
            assessment.SubmittedByUserId,
            assessment.CreatedAt
        ));

        return Ok(dtos);
    }

    /// <summary>
    /// Approve a crop analysis assessment and generate a corresponding Farm Task.
    /// </summary>
    [HttpPost("{id:guid}/approve")]
    public async Task<ActionResult<TaskResponseDto>> ApproveAssessment(Guid id, [FromBody] ApproveAssessmentRequestDto request)
    {
        try
        {
            var task = await _cropAnalysisService.ApproveAssessmentAndCreateTaskAsync(id, request.ManagerUserId, request.Comments);
            
            var taskDto = new TaskResponseDto(
                task.Id,
                task.FieldId,
                task.CropSeasonId,
                task.TaskType,
                task.Priority,
                task.Description,
                task.TargetDate,
                task.Status,
                task.CreatedAt,
                task.UpdatedAt,
                Enumerable.Empty<TaskAssignmentDto>(),
                null
            );

            return Ok(taskDto);
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(ex.Message);
        }
    }

    /// <summary>
    /// Reject a crop analysis assessment.
    /// </summary>
    [HttpPost("{id:guid}/reject")]
    public async Task<IActionResult> RejectAssessment(Guid id, [FromBody] RejectAssessmentRequestDto request)
    {
        var result = await _cropAnalysisService.RejectAssessmentAsync(id, request.ManagerUserId, request.Comments);
        if (!result)
        {
            return NotFound($"Crop analysis assessment with ID '{id}' not found.");
        }

        return NoContent();
    }
}
