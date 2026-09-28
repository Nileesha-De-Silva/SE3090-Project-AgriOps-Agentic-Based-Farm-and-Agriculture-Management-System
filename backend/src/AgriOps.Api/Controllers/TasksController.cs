using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using AgriOps.Api.Dtos;
using AgriOps.Core.Entities;
using AgriOps.Core.Interfaces;

namespace AgriOps.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TasksController : ControllerBase
{
    private readonly ITaskService _taskService;

    public TasksController(ITaskService taskService)
    {
        _taskService = taskService;
    }

    /// <summary>
    /// Search and list farm tasks with optional filtering by status, priority, fieldId, or workerId.
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<TaskResponseDto>>> GetTasks(
        [FromQuery] string? status,
        [FromQuery] string? priority,
        [FromQuery] Guid? fieldId,
        [FromQuery] Guid? workerId)
    {
        var tasks = await _taskService.GetTasksAsync(status, priority, fieldId, workerId);
        var dtos = tasks.Select(MapToTaskResponseDto);
        return Ok(dtos);
    }

    /// <summary>
    /// Get details of a single farm task by ID.
    /// </summary>
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<TaskResponseDto>> GetTaskById(Guid id)
    {
        var task = await _taskService.GetTaskByIdAsync(id);
        if (task == null)
        {
            return NotFound($"Task with ID '{id}' not found.");
        }

        return Ok(MapToTaskResponseDto(task));
    }

    /// <summary>
    /// Manually create a new farm task.
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<TaskResponseDto>> CreateTask([FromBody] CreateTaskDto dto)
    {
        var task = new FarmTask
        {
            FieldId = dto.FieldId,
            CropSeasonId = dto.CropSeasonId,
            TaskType = dto.TaskType,
            Priority = dto.Priority,
            Description = dto.Description,
            TargetDate = dto.TargetDate,
            Status = "Pending"
        };

        var created = await _taskService.CreateTaskAsync(task);
        return CreatedAtAction(nameof(GetTaskById), new { id = created.Id }, MapToTaskResponseDto(created));
    }

    /// <summary>
    /// Assign a worker to a farm task.
    /// </summary>
    [HttpPost("{id:guid}/assign")]
    public async Task<ActionResult<TaskAssignmentDto>> AssignWorker(Guid id, [FromBody] AssignWorkerDto dto)
    {
        try
        {
            var assignment = await _taskService.AssignWorkerAsync(id, dto.WorkerId);
            var response = new TaskAssignmentDto(
                assignment.Id,
                assignment.TaskId,
                assignment.WorkerId,
                assignment.Worker?.FullName,
                assignment.AssignedDate,
                assignment.Status
            );
            return Ok(response);
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(ex.Message);
        }
    }

    /// <summary>
    /// Update the execution status of a task.
    /// </summary>
    [HttpPatch("{id:guid}/status")]
    public async Task<ActionResult<TaskResponseDto>> UpdateTaskStatus(Guid id, [FromBody] UpdateTaskStatusDto dto)
    {
        try
        {
            var updatedTask = await _taskService.UpdateTaskStatusAsync(id, dto.NewStatus, dto.UserId, dto.Remarks);
            return Ok(MapToTaskResponseDto(updatedTask));
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(ex.Message);
        }
    }

    /// <summary>
    /// Submit completion evidence (photo URL + remarks) by a field worker.
    /// </summary>
    [HttpPost("{id:guid}/evidence")]
    public async Task<ActionResult<TaskHistoryDto>> SubmitEvidence(Guid id, [FromBody] SubmitEvidenceDto dto)
    {
        try
        {
            var history = await _taskService.SubmitTaskEvidenceAsync(id, dto.EvidencePhotoUrl, dto.Remarks, dto.WorkerUserId);
            var historyDto = new TaskHistoryDto(
                history.Id,
                history.TaskId,
                history.PreviousStatus,
                history.NewStatus,
                history.ChangedByUserId,
                history.Remarks,
                history.EvidencePhotoUrl,
                history.Timestamp
            );
            return Ok(historyDto);
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(ex.Message);
        }
    }

    /// <summary>
    /// Verify task evidence (Approve/Reject) by a farm manager.
    /// </summary>
    [HttpPost("{id:guid}/verify")]
    public async Task<ActionResult<TaskResponseDto>> VerifyEvidence(Guid id, [FromBody] VerifyEvidenceDto dto)
    {
        try
        {
            var verifiedTask = await _taskService.VerifyTaskEvidenceAsync(id, dto.IsApproved, dto.ManagerUserId, dto.Remarks);
            return Ok(MapToTaskResponseDto(verifiedTask));
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(ex.Message);
        }
    }

    /// <summary>
    /// Get full audit history log of a task.
    /// </summary>
    [HttpGet("{id:guid}/history")]
    public async Task<ActionResult<IEnumerable<TaskHistoryDto>>> GetTaskHistory(Guid id)
    {
        var history = await _taskService.GetTaskHistoryAsync(id);
        var dtos = history.Select(h => new TaskHistoryDto(
            h.Id,
            h.TaskId,
            h.PreviousStatus,
            h.NewStatus,
            h.ChangedByUserId,
            h.Remarks,
            h.EvidencePhotoUrl,
            h.Timestamp
        ));
        return Ok(dtos);
    }

    private static TaskResponseDto MapToTaskResponseDto(FarmTask task)
    {
        var assignments = task.Assignments?.Select(a => new TaskAssignmentDto(
            a.Id,
            a.TaskId,
            a.WorkerId,
            a.Worker?.FullName,
            a.AssignedDate,
            a.Status
        )) ?? Enumerable.Empty<TaskAssignmentDto>();

        TaskScheduleDto? schedule = null;
        if (task.Schedule != null)
        {
            schedule = new TaskScheduleDto(
                task.Schedule.Id,
                task.Schedule.Frequency,
                task.Schedule.StartDate,
                task.Schedule.EndDate,
                task.Schedule.NextExecutionDate,
                task.Schedule.IsActive
            );
        }

        return new TaskResponseDto(
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
            assignments,
            schedule
        );
    }
}
