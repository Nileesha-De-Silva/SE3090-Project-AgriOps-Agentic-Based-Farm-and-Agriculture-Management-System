using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using AgriOps.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AgriOps.Api.Controllers;

[ApiController]
[Route("api/validation-safety")]
public class ValidationSafetyController : ControllerBase
{
    private readonly IValidationSafetyService _validationService;
    private readonly IWeatherService _weatherService;

    public ValidationSafetyController(
        IValidationSafetyService validationService,
        IWeatherService weatherService)
    {
        _validationService = validationService;
        _weatherService = weatherService;
    }

    /// <summary>
    /// Run deterministic validation and safety checks on an AI-generated farm proposal.
    /// </summary>
    [HttpPost("validate")]
    public async Task<ActionResult<ValidationReportDto>> ValidateProposal([FromBody] ProposalValidationRequestDto request)
    {
        if (request == null) return BadRequest("Request body cannot be null.");
        var report = await _validationService.ValidateProposalAsync(request);
        return Ok(report);
    }

    /// <summary>
    /// Get historical audit log of all deterministic validation runs from PostgreSQL.
    /// </summary>
    [HttpGet("history")]
    public async Task<ActionResult<List<ValidationReportDto>>> GetHistory([FromQuery] int take = 50)
    {
        var history = await _validationService.GetValidationHistoryAsync(take);
        return Ok(history);
    }

    /// <summary>
    /// Fetch live 3rd-party meteorological data (temperature, rain prob, humidity, wind, forecast).
    /// </summary>
    [HttpGet("weather")]
    public async Task<ActionResult<WeatherDataDto>> GetLiveWeather(
        [FromQuery] double latitude = 6.9271,
        [FromQuery] double longitude = 79.8612)
    {
        var weather = await _weatherService.GetCurrentAndForecastWeatherAsync(latitude, longitude);
        return Ok(weather);
    }

    /// <summary>
    /// Human Approval Gate: Farm Manager approves a validated proposal for real-world execution.
    /// </summary>
    [HttpPost("{id:guid}/approve")]
    [Authorize(Roles = "Administrator,FarmManager,Agronomist,Manager")]
    public async Task<IActionResult> ApproveValidation(Guid id, [FromBody] ApprovalDecisionDto? body)
    {
        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        _ = Guid.TryParse(userIdStr, out var managerId);

        var success = await _validationService.ApproveValidationOutcomeAsync(id, managerId, body?.ManagerNotes);
        if (!success) return NotFound($"Validation record '{id}' not found.");

        return Ok(new { message = "Proposal approved for field execution and scheduled in farm task board." });
    }
}

public record ApprovalDecisionDto(string? ManagerNotes);
