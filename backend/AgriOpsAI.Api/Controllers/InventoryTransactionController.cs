using System.ComponentModel.DataAnnotations;
using AgriOpsAI.Api.DTOs;
using AgriOpsAI.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace AgriOpsAI.Api.Controllers;

[ApiController]
[Route("api/inventory/{inventoryItemId:guid}/transactions")]
public class InventoryTransactionController : ControllerBase
{
    private readonly InventoryTransactionService _service;

    public InventoryTransactionController(
        InventoryTransactionService service)
    {
        _service = service;
    }

    [HttpGet]
    [ProducesResponseType(
      typeof(List<InventoryTransactionDto>),
      StatusCodes.Status200OK )]

    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<List<InventoryTransactionDto>>> GetHistory(
      Guid inventoryItemId)
  {
     var history = await _service.GetHistoryAsync(inventoryItemId);

     if(history is null)
    {
        return NotFound(new
        {
          message = "Inventory item not found."
        });
    }

    return Ok(history);

  }

    [HttpGet("/api/transactions/{transactionId:guid}")]
    [ProducesResponseType(
        typeof(InventoryTransactionDto),
        StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<InventoryTransactionDto>> GetById(
    Guid transactionId)
    {
    var transaction = await _service.GetByIdAsync(transactionId);

    if (transaction is null)
    {
        return NotFound(new
        {
            message = "Inventory transaction not found."
        });
    }

    return Ok(transaction);
}

    [HttpPost]
    [ProducesResponseType(
        typeof(InventoryTransactionDto),
        StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<InventoryTransactionDto>> Create(
        Guid inventoryItemId,
        [FromBody] CreateInventoryTransactionDto dto)
    {
        try
        {
            var transaction = await _service.CreateAsync(
                inventoryItemId,
                dto);

            if (transaction is null)
            {
                return NotFound(new
                {
                    message = "Inventory item not found."
                });
            }

            return StatusCode(
                StatusCodes.Status201Created,
                transaction);
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
}
