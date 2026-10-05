using AgriOpsAI.Api.DTOs;
using AgriOpsAI.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AgriOpsAI.Api.Controllers;

[ApiController]
[Authorize(Policy = "Manager")]
[Route("api/purchase-requests")]
public class PurchaseRequestController(PurchaseRequestService service) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<PurchaseRequestDto>>> GetAll() => Ok(await service.GetAllAsync());

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(PurchaseRequestDto), 200)]
    [ProducesResponseType(404)]
    public async Task<ActionResult<PurchaseRequestDto>> GetById(Guid id)
    {
        var request = await service.GetByIdAsync(id);
        return request is null ? NotFound(new { message = "Purchase request not found." }) : Ok(request);
    }
}
