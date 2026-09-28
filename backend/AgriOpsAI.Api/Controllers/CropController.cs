using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AgriOpsAI.Api.Data;
using AgriOpsAI.Api.Models;
using AgriOpsAI.Api.DTOs;

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

    private static CropDto ToDto(Crop c) => new()
    {
        Id = c.Id,
        CropName = c.CropName,
        Variety = c.Variety,
        OptimalGrowthDurationDays = c.OptimalGrowthDurationDays,
        Description = c.Description
    };

    [HttpGet]
    public async Task<ActionResult<IEnumerable<CropDto>>> GetCrops()
    {
        var crops = await _context.Crops.ToListAsync();
        return crops.Select(ToDto).ToList();
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<CropDto>> GetCrop(Guid id)
    {
        var crop = await _context.Crops.FindAsync(id);
        if (crop == null) return NotFound();
        return ToDto(crop);
    }

    [HttpPost]
    public async Task<ActionResult<CropDto>> CreateCrop(CreateCropDto dto)
    {
        var crop = new Crop
        {
            Id = Guid.NewGuid(),
            CropName = dto.CropName,
            Variety = dto.Variety,
            OptimalGrowthDurationDays = dto.OptimalGrowthDurationDays,
            Description = dto.Description
        };

        _context.Crops.Add(crop);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetCrop), new { id = crop.Id }, ToDto(crop));
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateCrop(Guid id, UpdateCropDto dto)
    {
        var crop = await _context.Crops.FindAsync(id);
        if (crop == null) return NotFound();

        crop.CropName = dto.CropName;
        crop.Variety = dto.Variety;
        crop.OptimalGrowthDurationDays = dto.OptimalGrowthDurationDays;
        crop.Description = dto.Description;

        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id}")]
public async Task<IActionResult> DeleteCrop(Guid id)
{
    var crop = await _context.Crops.FindAsync(id);
    if (crop == null) return NotFound();

    try
    {
        _context.Crops.Remove(crop);
        await _context.SaveChangesAsync();
        return NoContent();
    }
    catch (DbUpdateException)
    {
        return Conflict(new
        {
            message = "This crop cannot be deleted because it is still referenced by one or more crop seasons."
        });
    }
}
}