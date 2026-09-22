using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AgriOpsAI.Api.Data;
using AgriOpsAI.Api.Models;
using AgriOpsAI.Api.DTOs;

namespace AgriOpsAI.Api.Controllers;

[ApiController]
[Route("api/cropseason/{cropSeasonId}/[controller]")]
public class PlantingController : ControllerBase
{
    private readonly AgriOpsDbContext _context;

    public PlantingController(AgriOpsDbContext context)
    {
        _context = context;
    }

    private static PlantingDto ToDto(Planting p) => new()
    {
        Id = p.Id,
        CropSeasonId = p.CropSeasonId,
        PlantingDate = p.PlantingDate,
        InitialQuantity = p.InitialQuantity,
        PlantingMethod = p.PlantingMethod,
        Notes = p.Notes
    };

    [HttpGet]
    public async Task<ActionResult<IEnumerable<PlantingDto>>> GetPlantings(Guid cropSeasonId)
    {
        var plantings = await _context.Plantings
            .Where(p => p.CropSeasonId == cropSeasonId)
            .ToListAsync();
        return plantings.Select(ToDto).ToList();
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<PlantingDto>> GetPlanting(Guid cropSeasonId, Guid id)
    {
        var planting = await _context.Plantings
            .FirstOrDefaultAsync(p => p.Id == id && p.CropSeasonId == cropSeasonId);
        if (planting == null) return NotFound();
        return ToDto(planting);
    }

    [HttpPost]
    public async Task<ActionResult<PlantingDto>> CreatePlanting(Guid cropSeasonId, CreatePlantingDto dto)
    {
        var seasonExists = await _context.CropSeasons.AnyAsync(cs => cs.Id == cropSeasonId);
        if (!seasonExists) return BadRequest($"CropSeason with id {cropSeasonId} does not exist.");

        var planting = new Planting
        {
            Id = Guid.NewGuid(),
            CropSeasonId = cropSeasonId,
            PlantingDate = dto.PlantingDate,
            InitialQuantity = dto.InitialQuantity,
            PlantingMethod = dto.PlantingMethod,
            Notes = dto.Notes
        };

        _context.Plantings.Add(planting);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetPlanting), new { cropSeasonId, id = planting.Id }, ToDto(planting));
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeletePlanting(Guid cropSeasonId, Guid id)
    {
        var planting = await _context.Plantings
            .FirstOrDefaultAsync(p => p.Id == id && p.CropSeasonId == cropSeasonId);
        if (planting == null) return NotFound();

        _context.Plantings.Remove(planting);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}