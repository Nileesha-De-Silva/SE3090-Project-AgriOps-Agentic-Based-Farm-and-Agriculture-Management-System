using System.ComponentModel.DataAnnotations;
using System.Security.Claims;
using AgriOpsAI.Api.DTOs;
using AgriOpsAI.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AgriOpsAI.Api.Controllers;

[ApiController]
[Route("api/reorder-recommendations")]
public class ReorderRecommendationController(ReorderRecommendationService service) : ControllerBase
{
    [Authorize(Policy = "RecommendationReader")]
    [HttpGet]
    public async Task<ActionResult<List<ReorderRecommendationDto>>> GetAll() => Ok(await service.GetAllAsync());

    [Authorize(Policy = "RecommendationReader")]
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(ReorderRecommendationDto), 200)]
    [ProducesResponseType(404)]
    public async Task<ActionResult<ReorderRecommendationDto>> Get(Guid id)
    {
        var result = await service.GetAsync(id);
        return result is null ? NotFound() : Ok(result);
    }

    [Authorize(Policy = "InventoryAgent")]
    [HttpPost]
    [ProducesResponseType(typeof(ReorderRecommendationDto), 201)]
    [ProducesResponseType(400)]
    [ProducesResponseType(401)]
    [ProducesResponseType(403)]
    [ProducesResponseType(404)]
    [ProducesResponseType(409)]
    public async Task<ActionResult<ReorderRecommendationDto>> Create(CreateReorderRecommendationDto dto)
    {
        try
        {
            var result = await service.CreateAsync(dto, User.FindFirstValue("sub")!, User.FindFirstValue("iss")!);
            return result is null ? NotFound(new { message = "Inventory item or supplier not found." })
                : CreatedAtAction(nameof(Get), new { id = result.Id }, result);
        }
        catch (ValidationException exception) { return BadRequest(new { message = exception.Message }); }
        catch (InvalidOperationException exception) { return Conflict(new { message = exception.Message }); }
    }

    [Authorize(Policy = "Manager")]
    [HttpPost("{id:guid}/approve")]
    [ProducesResponseType(typeof(ReorderRecommendationDto), 200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(401)]
    [ProducesResponseType(403)]
    [ProducesResponseType(404)]
    [ProducesResponseType(409)]
    public Task<ActionResult<ReorderRecommendationDto>> Approve(Guid id, RecommendationDecisionDto dto)
        => Decide(id, true, dto);

    [Authorize(Policy = "Manager")]
    [HttpPost("{id:guid}/reject")]
    [ProducesResponseType(typeof(ReorderRecommendationDto), 200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(401)]
    [ProducesResponseType(403)]
    [ProducesResponseType(404)]
    [ProducesResponseType(409)]
    public Task<ActionResult<ReorderRecommendationDto>> Reject(Guid id, RecommendationDecisionDto dto)
        => Decide(id, false, dto);

    private async Task<ActionResult<ReorderRecommendationDto>> Decide(Guid id, bool approve, RecommendationDecisionDto dto)
    {
        try
        {
            var result = await service.DecideAsync(id, approve, dto, User.FindFirstValue("sub")!, User.FindFirstValue("iss")!);
            return result is null ? NotFound(new { message = "Recommendation not found." }) : Ok(result);
        }
        catch (ValidationException exception) { return BadRequest(new { message = exception.Message }); }
        catch (InvalidOperationException exception) { return Conflict(new { message = exception.Message }); }
    }
}
