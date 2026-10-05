using System.ComponentModel.DataAnnotations;
using AgriOpsAI.Api.DTOs;
using AgriOpsAI.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace AgriOpsAI.Api.Controllers;

[ApiController]
[Route("api/inventory")]
public class InventoryController : ControllerBase
{
    private readonly InventoryService _service;

    public InventoryController(InventoryService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<ActionResult<List<InventoryItemDto>>> GetAll()
    {
        var items = await _service.GetAllAsync();
        return Ok(items);
    }

    [HttpGet("low-stock")]
    [ProducesResponseType(typeof(List<InventoryItemDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<InventoryItemDto>>> GetLowStock()
    {
        return Ok(await _service.GetLowStockAsync());
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<InventoryItemDto>> GetById(Guid id)
    {
        var item = await _service.GetByIdAsync(id);

        if (item is null)
        {
            return NotFound(new
            {
                message = "Inventory item not found."
            });
        }

        return Ok(item);
    }

    [HttpPost]
    public async Task<ActionResult<InventoryItemDto>> Create(
        [FromBody] CreateInventoryItemDto dto)
    {
        try
        {
            var item = await _service.CreateAsync(dto);

            return CreatedAtAction(
                nameof(GetById),
                new { id = item.Id },
                item);
        }
        catch (ValidationException exception)
        {
            return BadRequest(new
            {
                message = exception.Message
            });
        }
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<InventoryItemDto>> Update(
        Guid id,
        [FromBody] UpdateInventoryItemDto dto)
    {
        try
        {
            var item = await _service.UpdateAsync(id, dto);

            if (item is null)
            {
                return NotFound(new
                {
                    message = "Inventory item not found."
                });
            }

            return Ok(item);
        }
        catch (ValidationException exception)
        {
            return BadRequest(new
            {
                message = exception.Message
            });
        }
        catch (InvalidOperationException exception)
        {
            return Conflict(new
            {
                message = exception.Message
            });
        }
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        try
        {
            var deleted = await _service.DeleteAsync(id);

            if (!deleted)
            {
                return NotFound(new
                {
                    message = "Inventory item not found."
                });
            }

            return NoContent();
        }
        catch (InvalidOperationException exception)
        {
            return Conflict(new
            {
                message = exception.Message
            });
        }
    }

}
