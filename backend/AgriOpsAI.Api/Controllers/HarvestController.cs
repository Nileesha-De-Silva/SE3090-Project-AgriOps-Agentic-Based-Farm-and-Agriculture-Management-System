using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AgriOpsAI.Api.Data;
using AgriOpsAI.Api.Models;
using AgriOpsAI.Api.DTOs;

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

    private static HarvestDto ToDto(Harvest h) => new()
    {
        Id = h.Id,
        CropSeasonId = h.CropSeasonId,
        HarvestDate = h.HarvestDate,
        YieldAmount = h.YieldAmount,
        QualityGrade = h.QualityGrade,
        RecordedByUserId = h.RecordedByUserId
    };

    [HttpGet]
    public async Task<ActionResult<IEnumerable<HarvestDto>>> GetHarvests(Guid cropSeasonId)
    {
        var harvests = await _context.Harvests
            .Where(h => h.CropSeasonId == cropSeasonId)
            .ToListAsync();
        return harvests.Select(ToDto).ToList();
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<HarvestDto>> GetHarvest(Guid cropSeasonId, Guid id)
    {
        var harvest = await _context.Harvests
            .FirstOrDefaultAsync(h => h.Id == id && h.CropSeasonId == cropSeasonId);
        if (harvest == null) return NotFound();
        return ToDto(harvest);
    }

    [HttpPost]
    public async Task<ActionResult<HarvestDto>> CreateHarvest(Guid cropSeasonId, CreateHarvestDto dto)
    {
        var seasonExists = await _context.CropSeasons.AnyAsync(cs => cs.Id == cropSeasonId);
        if (!seasonExists) return BadRequest($"CropSeason with id {cropSeasonId} does not exist.");

        var harvest = new Harvest
        {
            Id = Guid.NewGuid(),
            CropSeasonId = cropSeasonId,
            HarvestDate = dto.HarvestDate,
            YieldAmount = dto.YieldAmount,
            QualityGrade = dto.QualityGrade,
            RecordedByUserId = dto.RecordedByUserId
        };

        _context.Harvests.Add(harvest);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetHarvest), new { cropSeasonId, id = harvest.Id }, ToDto(harvest));
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateHarvest(Guid cropSeasonId, Guid id, UpdateHarvestDto dto)
    {
        var harvest = await _context.Harvests
            .FirstOrDefaultAsync(h => h.Id == id && h.CropSeasonId == cropSeasonId);
        if (harvest == null) return NotFound();

        harvest.HarvestDate = dto.HarvestDate;
        harvest.YieldAmount = dto.YieldAmount;
        harvest.QualityGrade = dto.QualityGrade;
        harvest.RecordedByUserId = dto.RecordedByUserId;

        await _context.SaveChangesAsync();
        return NoContent();
    }

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