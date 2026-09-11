using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AgriOpsAI.Api.Data;
using AgriOpsAI.Api.Models;
using AgriOpsAI.Api.DTOs;
using AgriOpsAI.Api.Services;

namespace AgriOpsAI.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CropSeasonController : ControllerBase
{
    private readonly AgriOpsDbContext _context;

    public CropSeasonController(AgriOpsDbContext context)
    {
        _context = context;
    }
    
    [HttpGet]
public async Task<ActionResult<IEnumerable<CropSeasonDto>>> GetCropSeasons([FromQuery] Guid? fieldId, [FromQuery] string? status)
{
    var query = _context.CropSeasons.AsQueryable();

    if (fieldId.HasValue) query = query.Where(cs => cs.FieldId == fieldId.Value);

    if (!string.IsNullOrEmpty(status) && Enum.TryParse<CropSeasonStatus>(status, true, out var parsedStatus))
        query = query.Where(cs => cs.Status == parsedStatus);

    var seasons = await query.ToListAsync();

    var result = new List<CropSeasonDto>();
    foreach (var season in seasons)
    {
        result.Add(await ToDtoAsync(season));
    }
    return result;
}

[HttpGet("{id}")]
public async Task<ActionResult<CropSeasonDto>> GetCropSeason(Guid id)
{
    var cropSeason = await _context.CropSeasons.FindAsync(id);
    if (cropSeason == null) return NotFound();
    return await ToDtoAsync(cropSeason);
}

    [HttpPost]
public async Task<ActionResult<CropSeasonDto>> CreateCropSeason(CreateCropSeasonDto dto)
{
    var fieldExists = await _context.Fields.AnyAsync(f => f.Id == dto.FieldId);
    if (!fieldExists) return BadRequest($"Field with id {dto.FieldId} does not exist.");

    var cropExists = await _context.Crops.AnyAsync(c => c.Id == dto.CropId);
    if (!cropExists) return BadRequest($"Crop with id {dto.CropId} does not exist.");

    var cropSeason = new CropSeason
    {
        Id = Guid.NewGuid(),
        FieldId = dto.FieldId,
        CropId = dto.CropId,
        SeasonName = dto.SeasonName,
        StartDate = dto.StartDate,
        TargetEndDate = dto.TargetEndDate,
        Status = dto.Status
    };

    _context.CropSeasons.Add(cropSeason);
    await _context.SaveChangesAsync();

    return CreatedAtAction(nameof(GetCropSeason), new { id = cropSeason.Id }, await ToDtoAsync(cropSeason));
}

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateCropSeason(Guid id, UpdateCropSeasonDto dto)
    {
        var cropSeason = await _context.CropSeasons.FindAsync(id);
        if (cropSeason == null) return NotFound();

        cropSeason.SeasonName = dto.SeasonName;
        cropSeason.StartDate = dto.StartDate;
        cropSeason.TargetEndDate = dto.TargetEndDate;
        cropSeason.Status = dto.Status;

        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteCropSeason(Guid id)
    {
        var cropSeason = await _context.CropSeasons.FindAsync(id);
        if (cropSeason == null) return NotFound();

        _context.CropSeasons.Remove(cropSeason);
        await _context.SaveChangesAsync();
        return NoContent();
    }

    private async Task<CropSeasonDto> ToDtoAsync(CropSeason cs)
{
    var earliestPlanting = await _context.Plantings
        .Where(p => p.CropSeasonId == cs.Id)
        .OrderBy(p => p.PlantingDate)
        .Select(p => (DateTime?)p.PlantingDate)
        .FirstOrDefaultAsync();

    var crop = await _context.Crops.FindAsync(cs.CropId);
    var optimalDays = crop?.OptimalGrowthDurationDays ?? 0;

    return new CropSeasonDto
    {
        Id = cs.Id,
        FieldId = cs.FieldId,
        CropId = cs.CropId,
        SeasonName = cs.SeasonName,
        StartDate = cs.StartDate,
        TargetEndDate = cs.TargetEndDate,
        Status = cs.Status,
        CurrentGrowthStage = GrowthStageCalculator.Calculate(earliestPlanting, optimalDays)
    };
}
}