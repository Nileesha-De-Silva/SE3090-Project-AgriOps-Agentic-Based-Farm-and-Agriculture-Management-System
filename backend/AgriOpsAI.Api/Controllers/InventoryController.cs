using AgriOpsAI.Api.DTOs;
using AgriOpsAI.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace AgriOpsAI.Api.Controller;

[ApiController]
[Route("api/inventory")]
public class InventoryController : ControllerBase
{
    private readonly InventoryService  _service;

    public InventoryController(InventoryService service)
  {
    _service = service;

  }

  [HttpGet]
  public async Task<ActionResult<InventoryItemDto>> GetAll()
  {
    var items = await _service.GetAllAsync();
    return Ok(items);
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

}
