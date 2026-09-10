using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AgriOpsAI.Api.Data;
using AgriOpsAI.Api.Models;

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

    // GET: api/cropseason/{cropSeasonId}/planting
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Planting>>> GetPlantings(Guid cropSeasonId)
    {
        return await _context.Plantings
            .Where(p => p.CropSeasonId == cropSeasonId)
            .ToListAsync();
    }

    // GET: api/cropseason/{cropSeasonId}/planting/{id}
    [HttpGet("{id}")]
    public async Task<ActionResult<Planting>> GetPlanting(Guid cropSeasonId, Guid id)
    {
        var planting = await _context.Plantings
            .FirstOrDefaultAsync(p => p.Id == id && p.CropSeasonId == cropSeasonId);

        if (planting == null) return NotFound();
        return planting;
    }

    // POST: api/cropseason/{cropSeasonId}/planting
    [HttpPost]
    public async Task<ActionResult<Planting>> CreatePlanting(Guid cropSeasonId, Planting planting)
    {
        var seasonExists = await _context.CropSeasons.AnyAsync(cs => cs.Id == cropSeasonId);
        if (!seasonExists) return BadRequest($"CropSeason with id {cropSeasonId} does not exist.");

        planting.Id = Guid.NewGuid();
        planting.CropSeasonId = cropSeasonId; // enforced from the URL, not trusted from the body

        _context.Plantings.Add(planting);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetPlanting), new { cropSeasonId, id = planting.Id }, planting);
    }

    // DELETE: api/cropseason/{cropSeasonId}/planting/{id}
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