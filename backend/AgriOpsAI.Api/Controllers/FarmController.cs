using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AgriOpsAI.Api.Data;
using AgriOpsAI.Api.Models;

namespace AgriOpsAI.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class FarmController : ControllerBase
{
    private readonly AgriOpsDbContext _context;
    
    public FarmController(AgriOpsDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Farm>>> GetFarms()
    {
        return await _context.Farms.ToListAsync();
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Farm>> GetFarm(Guid id)
    {
        var farm = await _context.Farms.FindAsync(id);

        if(farm == null)
        {
            return NotFound();
        }

        return farm;
    }


    [HttpPost]
    public async Task<ActionResult<Farm>> CreateFarm(Farm farm)
    {
        farm.Id = Guid.NewGuid();
        farm.CreatedAt= DateTime.UtcNow;
        farm.UpdatedAt = DateTime.UtcNow;

        _context.Farms.Add(farm);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetFarm), new {id = farm.Id}, farm);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateFarm(Guid id, Farm farm)
    {
        if(id != farm.Id)
        {
            return BadRequest();
        }

        var existingFarm = await _context.Farms.FindAsync(id);
        if (farm == null)
        {
            return NotFound();
        }

        _context.Farms.Remove(farm);
        await _context.SaveChangesAsync();

        return NoContent();
    }


}