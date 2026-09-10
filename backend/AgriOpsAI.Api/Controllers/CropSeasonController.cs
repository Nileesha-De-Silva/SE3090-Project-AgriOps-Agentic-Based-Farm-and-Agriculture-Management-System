using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AgriOpsAI.Api.Data;
using AgriOpsAI.Api.Models;

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
    public async Task<ActionResult<IEnumerable<CropSeason>>> GetCropSeasons([FromQuery] Guid? fieldId, [FromQuery] string? status)
    {
        var query = _context.CropSeasons.AsQueryable();

        if (fieldId.HasValue)
            query = query.Where(cs => cs.FieldId == fieldId.Value);

        if (!string.IsNullOrEmpty(status) && Enum.TryParse<CropSeasonStatus>(status, true, out var parsedStatus))
            query = query.Where(cs => cs.Status == parsedStatus);

        return await query.ToListAsync();
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<CropSeason>> GetCropSeason(Guid id)
    {
        var cropSeason = await _context.CropSeasons.FindAsync(id);
        if (cropSeason == null) return NotFound();
        return cropSeason;
    }

    [HttpPost]
    public async Task<ActionResult<CropSeason>> CreateCropSeason(CropSeason cropSeason)
    {
        var fieldExists = await _context.Fields.AnyAsync(f => f.Id == cropSeason.FieldId);
        if (!fieldExists) return BadRequest($"Field with id {cropSeason.FieldId} does not exist.");

        var cropExists = await _context.Crops.AnyAsync(c => c.Id == cropSeason.CropId);
        if (!cropExists) return BadRequest($"Crop with id {cropSeason.CropId} does not exist.");

        cropSeason.Id = Guid.NewGuid();
        _context.CropSeasons.Add(cropSeason);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetCropSeason), new { id = cropSeason.Id }, cropSeason);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateCropSeason(Guid id, CropSeason cropSeason)
    {
        if (id != cropSeason.Id) return BadRequest();

        var existing = await _context.CropSeasons.FindAsync(id);
        if (existing == null) return NotFound();

        existing.SeasonName = cropSeason.SeasonName;
        existing.StartDate = cropSeason.StartDate;
        existing.TargetEndDate = cropSeason.TargetEndDate;
        existing.Status = cropSeason.Status;

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
}