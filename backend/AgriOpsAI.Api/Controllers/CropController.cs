using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AgriOpsAI.Api.Data;
using AgriOpsAI.Api.Models;

namespace AgriOpsAI.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CropController : ControllerBase
{
    private readonly AgriOpsDbContext _context;

    public CropController(AgriOpsDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Crop>>> GetCrops()
    {
        return await _context.Crops.ToListAsync();
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Crop>> GetCrop(Guid id)
    {
        var crop = await _context.Crops.FindAsync(id);
        if (crop == null) return NotFound();
        return crop;
    }

    [HttpPost]
    public async Task<ActionResult<Crop>> CreateCrop(Crop crop)
    {
        crop.Id = Guid.NewGuid();
        _context.Crops.Add(crop);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetCrop), new { id = crop.Id }, crop);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateCrop(Guid id, Crop crop)
    {
        if (id != crop.Id) return BadRequest();

        var existingCrop = await _context.Crops.FindAsync(id);
        if (existingCrop == null) return NotFound();

        existingCrop.CropName = crop.CropName;
        existingCrop.Variety = crop.Variety;
        existingCrop.OptimalGrowthDurationDays = crop.OptimalGrowthDurationDays;
        existingCrop.Description = crop.Description;

        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteCrop(Guid id)
    {
        var crop = await _context.Crops.FindAsync(id);
        if (crop == null) return NotFound();

        // Restrict delete behavior means EF/Postgres will block this
        // if any CropSeason still references it — that's intentional.
        _context.Crops.Remove(crop);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}