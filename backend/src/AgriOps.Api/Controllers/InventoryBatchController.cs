using AgriOpsAI.Api.Data;
using AgriOpsAI.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AgriOpsAI.Api.Controllers;

[ApiController]
[Authorize(Policy = "InventoryRead")]
public class InventoryBatchController(AgriOpsDbContext context) : ControllerBase
{
    public sealed class BatchDetailsInput {
        public DateOnly? ExpirationDate { get; set; }
        [System.ComponentModel.DataAnnotations.StringLength(100)] public string? BatchNumber { get; set; }
        [System.ComponentModel.DataAnnotations.StringLength(100)] public string? ShelfLocation { get; set; }
    }
    [Authorize(Policy = "Manager")]
    [HttpPut("api/inventory-batches/{id:guid}")]
    public async Task<IActionResult> Update(Guid id, BatchDetailsInput input) {
        var service = new InventoryBatchService(context);
        if (!await service.UpdateAsync(id, input.ExpirationDate, input.BatchNumber, input.ShelfLocation)) return NotFound(new { message = "Received batch not found." });
        return Ok(await service.GetAsync(id));
    }
    [HttpGet("api/inventory-batches/{id:guid}")]
    public async Task<IActionResult> Get(Guid id) {
        var result = await new InventoryBatchService(context).GetAsync(id);
        return result is null ? NotFound(new { message = "Batch or approved request not found." }) : Ok(result);
    }
    [HttpGet("api/inventory/{itemId:guid}/batches")]
    public async Task<IActionResult> List(Guid itemId)
        => Ok(await new InventoryBatchService(context).ListAsync(itemId));
}
