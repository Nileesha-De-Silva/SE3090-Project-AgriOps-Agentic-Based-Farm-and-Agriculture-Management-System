using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AgriOpsAI.Api.Data;
using AgriOpsAI.Api.Models;
using AgriOpsAI.Api.DTOs;

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

    private static FarmDto ToDto(Farm f) => new()
    {
        Id = f.Id,
        Name = f.Name,
        Location = f.Location,
        TotalArea = f.TotalArea,
        OwnerId = f.OwnerId,
        CreatedAt = f.CreatedAt,
        UpdatedAt = f.UpdatedAt
    };

    [HttpGet]
    public async Task<ActionResult<IEnumerable<FarmDto>>> GetFarms()
    {
        var farms = await _context.Farms.ToListAsync();
        return farms.Select(ToDto).ToList();
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<FarmDto>> GetFarm(Guid id)
    {
        var farm = await _context.Farms.FindAsync(id);
        if (farm == null) return NotFound();
        return ToDto(farm);
    }

    [HttpPost]
    public async Task<ActionResult<FarmDto>> CreateFarm(CreateFarmDto dto)
    {
        var farm = new Farm
        {
            Id = Guid.NewGuid(),
            Name = dto.Name,
            Location = dto.Location,
            TotalArea = dto.TotalArea,
            OwnerId = dto.OwnerId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Farms.Add(farm);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetFarm), new { id = farm.Id }, ToDto(farm));
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateFarm(Guid id, UpdateFarmDto dto)
    {
        var farm = await _context.Farms.FindAsync(id);
        if (farm == null) return NotFound();

        farm.Name = dto.Name;
        farm.Location = dto.Location;
        farm.TotalArea = dto.TotalArea;
        farm.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteFarm(Guid id)
    {
        var farm = await _context.Farms.FindAsync(id);
        if (farm == null) return NotFound();

        _context.Farms.Remove(farm);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}