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
    public sealed class ReceiptInput
    {
        [System.ComponentModel.DataAnnotations.StringLength(400)]
        public string? Notes { get; set; }
    }

    [HttpPost("{id:guid}/receive")]
    public async Task<IActionResult> Receive(Guid id, [FromBody] ReceiptInput input)
    {
        if (!InventoryPermissions.CanMove(User, "Receive")) return Forbid();
        try
        {
            var result = await service.ReceiveAsync(id, input.Notes);
            return result is null ? NotFound(new { message = "Purchase request not found." }) : Ok(result);
        }
        catch (InvalidOperationException ex) { return Conflict(new { message = ex.Message }); }
        catch (System.ComponentModel.DataAnnotations.ValidationException ex) { return BadRequest(new { message = ex.Message }); }
    }

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
