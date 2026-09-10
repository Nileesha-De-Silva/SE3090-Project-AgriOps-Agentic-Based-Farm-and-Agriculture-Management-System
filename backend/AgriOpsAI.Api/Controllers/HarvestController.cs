using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AgriOpsAI.Api.Data;
using AgriOpsAI.Api.Models;

namespace AgriOpsAI.Api.Controllers;

[ApiController]
[Route("api/cropseason/{cropSeasonId}/[controller]")]
public class HarvestController : ControllerBase
{
    private readonly AgriOpsDbContext _context;

    public HarvestController(AgriOpsDbContext context)
    {
        _context = context;
    }

    // GET: api/cropseason/{cropSeasonId}/harvest
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Harvest>>> GetHarvests(Guid cropSeasonId)
    {
        return await _context.Harvests
            .Where(h => h.CropSeasonId == cropSeasonId)
            .ToListAsync();
    }

    // GET: api/cropseason/{cropSeasonId}/harvest/{id}
    [HttpGet("{id}")]
    public async Task<ActionResult<Harvest>> GetHarvest(Guid cropSeasonId, Guid id)
    {
        var harvest = await _context.Harvests
            .FirstOrDefaultAsync(h => h.Id == id && h.CropSeasonId == cropSeasonId);

        if (harvest == null) return NotFound();
        return harvest;
    }

    // POST: api/cropseason/{cropSeasonId}/harvest
    [HttpPost]
    public async Task<ActionResult<Harvest>> CreateHarvest(Guid cropSeasonId, Harvest harvest)
    {
        var seasonExists = await _context.CropSeasons.AnyAsync(cs => cs.Id == cropSeasonId);
        if (!seasonExists) return BadRequest($"CropSeason with id {cropSeasonId} does not exist.");

        harvest.Id = Guid.NewGuid();
        harvest.CropSeasonId = cropSeasonId; // enforced from the URL, not trusted from the body

        _context.Harvests.Add(harvest);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetHarvest), new { cropSeasonId, id = harvest.Id }, harvest);
    }

    // PUT: api/cropseason/{cropSeasonId}/harvest/{id}
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateHarvest(Guid cropSeasonId, Guid id, Harvest harvest)
    {
        if (id != harvest.Id) return BadRequest();

        var existing = await _context.Harvests
            .FirstOrDefaultAsync(h => h.Id == id && h.CropSeasonId == cropSeasonId);

        if (existing == null) return NotFound();

        existing.HarvestDate = harvest.HarvestDate;
        existing.YieldAmount = harvest.YieldAmount;
        existing.QualityGrade = harvest.QualityGrade;
        existing.RecordedByUserId = harvest.RecordedByUserId;

        await _context.SaveChangesAsync();
        return NoContent();
    }

    // DELETE: api/cropseason/{cropSeasonId}/harvest/{id}
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteHarvest(Guid cropSeasonId, Guid id)
    {
        var harvest = await _context.Harvests
            .FirstOrDefaultAsync(h => h.Id == id && h.CropSeasonId == cropSeasonId);

        if (harvest == null) return NotFound();

        _context.Harvests.Remove(harvest);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}