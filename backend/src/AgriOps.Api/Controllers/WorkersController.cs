using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using AgriOps.Api.Dtos;
using AgriOps.Core.Entities;
using AgriOps.Core.Interfaces;
using AgriOps.Infrastructure.Services;

namespace AgriOps.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class WorkersController : ControllerBase
{
    private readonly IWorkerService _workerService;
    private readonly WorkerSkillMatcher _workerSkillMatcher;

    public WorkersController(IWorkerService workerService, WorkerSkillMatcher workerSkillMatcher)
    {
        _workerService = workerService;
        _workerSkillMatcher = workerSkillMatcher;
    }

    /// <summary>
    /// Get list of field workers with optional status filter.
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<WorkerResponseDto>>> GetAllWorkers([FromQuery] string? status)
    {
        var workers = await _workerService.GetAllWorkersAsync(status);
        var dtos = new List<WorkerResponseDto>();

        foreach (var w in workers)
        {
            int workload = await _workerService.GetActiveTaskLoadCountAsync(w.Id);
            dtos.Add(MapToWorkerResponseDto(w, workload));
        }

        return Ok(dtos);
    }

    /// <summary>
    /// Get details of a single worker by ID.
    /// </summary>
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<WorkerResponseDto>> GetWorkerById(Guid id)
    {
        var worker = await _workerService.GetWorkerByIdAsync(id);
        if (worker == null)
        {
            return NotFound($"Worker with ID '{id}' not found.");
        }

        int workload = await _workerService.GetActiveTaskLoadCountAsync(worker.Id);
        return Ok(MapToWorkerResponseDto(worker, workload));
    }

    /// <summary>
    /// Create a new field worker profile.
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<WorkerResponseDto>> CreateWorker([FromBody] CreateWorkerDto dto)
    {
        var worker = new Worker
        {
            UserId = dto.UserId,
            FullName = dto.FullName,
            ContactNumber = dto.ContactNumber,
            EmploymentType = dto.EmploymentType,
            Status = "Active"
        };

        var created = await _workerService.CreateWorkerAsync(worker);
        return CreatedAtAction(nameof(GetWorkerById), new { id = created.Id }, MapToWorkerResponseDto(created, 0));
    }

    /// <summary>
    /// Add a new skill to a worker's profile.
    /// </summary>
    [HttpPost("{id:guid}/skills")]
    public async Task<ActionResult<WorkerSkillDto>> AddSkill(Guid id, [FromBody] AddWorkerSkillDto dto)
    {
        try
        {
            var skill = await _workerService.AddWorkerSkillAsync(id, dto.SkillName, dto.ProficiencyLevel);
            var response = new WorkerSkillDto(
                skill.Id,
                skill.WorkerId,
                skill.SkillName,
                skill.ProficiencyLevel,
                skill.CreatedAt
            );
            return Ok(response);
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(ex.Message);
        }
    }

    /// <summary>
    /// Get skills of a specific worker.
    /// </summary>
    [HttpGet("{id:guid}/skills")]
    public async Task<ActionResult<IEnumerable<WorkerSkillDto>>> GetWorkerSkills(Guid id)
    {
        var skills = await _workerService.GetWorkerSkillsAsync(id);
        var dtos = skills.Select(s => new WorkerSkillDto(
            s.Id,
            s.WorkerId,
            s.SkillName,
            s.ProficiencyLevel,
            s.CreatedAt
        ));

        return Ok(dtos);
    }

    /// <summary>
    /// Find best matching workers for a target task type based on skills and active workload.
    /// </summary>
    [HttpGet("matched")]
    public async Task<ActionResult<IEnumerable<WorkerResponseDto>>> GetMatchedWorkers([FromQuery] string taskType, [FromQuery] int topN = 5)
    {
        var matchedWorkers = await _workerSkillMatcher.FindBestWorkersForTaskAsync(taskType, topN);
        var dtos = new List<WorkerResponseDto>();

        foreach (var w in matchedWorkers)
        {
            int workload = await _workerService.GetActiveTaskLoadCountAsync(w.Id);
            dtos.Add(MapToWorkerResponseDto(w, workload));
        }

        return Ok(dtos);
    }

    private static WorkerResponseDto MapToWorkerResponseDto(Worker worker, int activeWorkloadCount)
    {
        var skills = worker.Skills?.Select(s => new WorkerSkillDto(
            s.Id,
            s.WorkerId,
            s.SkillName,
            s.ProficiencyLevel,
            s.CreatedAt
        )) ?? Enumerable.Empty<WorkerSkillDto>();

        return new WorkerResponseDto(
            worker.Id,
            worker.UserId,
            worker.FullName,
            worker.ContactNumber,
            worker.EmploymentType,
            worker.Status,
            worker.CreatedAt,
            skills,
            activeWorkloadCount
        );
    }
}
