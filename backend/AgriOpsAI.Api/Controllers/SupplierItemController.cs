using System.ComponentModel.DataAnnotations;
using AgriOpsAI.Api.DTOs;
using AgriOpsAI.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace AgriOpsAI.Api.Controllers;

[ApiController]
[Route("api/suppliers/{supplierId:guid}/items")]
public class SupplierItemController(SupplierItemService service) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType(typeof(List<SupplierItemDto>), 200)]
    [ProducesResponseType(404)]
    public async Task<ActionResult<List<SupplierItemDto>>> GetAll(Guid supplierId)
    {
        var links = await service.GetAllAsync(supplierId);
        return links is null ? NotFound(new { message = "Supplier not found." }) : Ok(links);
    }

    [HttpGet("{inventoryItemId:guid}")]
    [ProducesResponseType(typeof(SupplierItemDto), 200)]
    [ProducesResponseType(404)]
    public async Task<ActionResult<SupplierItemDto>> Get(Guid supplierId, Guid inventoryItemId)
    {
        var link = await service.GetAsync(supplierId, inventoryItemId);
        return link is null ? Missing() : Ok(link);
    }

    [HttpPost("{inventoryItemId:guid}")]
    [ProducesResponseType(typeof(SupplierItemDto), 201)]
    [ProducesResponseType(400)]
    [ProducesResponseType(404)]
    [ProducesResponseType(409)]
    public Task<ActionResult<SupplierItemDto>> Create(Guid supplierId, Guid inventoryItemId, SaveSupplierItemDto dto)
        => Save(supplierId, inventoryItemId, dto, true);

    [HttpPut("{inventoryItemId:guid}")]
    [ProducesResponseType(typeof(SupplierItemDto), 200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(404)]
    [ProducesResponseType(409)]
    public Task<ActionResult<SupplierItemDto>> Update(Guid supplierId, Guid inventoryItemId, SaveSupplierItemDto dto)
        => Save(supplierId, inventoryItemId, dto, false);

    [HttpDelete("{inventoryItemId:guid}")]
    [ProducesResponseType(204)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> Delete(Guid supplierId, Guid inventoryItemId)
        => await service.DeleteAsync(supplierId, inventoryItemId) ? NoContent() : Missing();

    private async Task<ActionResult<SupplierItemDto>> Save(Guid supplierId, Guid inventoryItemId, SaveSupplierItemDto dto, bool create)
    {
        try
        {
            var link = await service.SaveAsync(supplierId, inventoryItemId, dto, create);
            if (link is null) return Missing();
            return create
                ? CreatedAtAction(nameof(Get), new { supplierId, inventoryItemId }, link)
                : Ok(link);
        }
        catch (ValidationException exception)
        {
            return BadRequest(new { message = exception.Message });
        }
        catch (InvalidOperationException exception)
        {
            return Conflict(new { message = exception.Message });
        }
    }

    private NotFoundObjectResult Missing() => NotFound(new { message = "Supplier, inventory item or supplier-item link not found." });
}
