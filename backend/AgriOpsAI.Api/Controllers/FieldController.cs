using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AgriOpsAI.Api.Data;
using AgriOpsAI.Api.Models;
using AgriOpsAI.Api.DTOs;

namespace AgriOpsAI.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class FieldController : ControllerBase
{
    private readonly AgriOpsDbContext _context;

    public FieldController(AgriOpsDbContext context)
    {
        _context = context;
    }

    private static FieldDto ToDto(Field f) => new()
    {
        Id = f.Id,
        FarmId = f.FarmId,
        FieldName = f.FieldName,
        AreaSize = f.AreaSize,
        SoilType = f.SoilType,
        BoundaryCoordinates = f.BoundaryCoordinates,
        CreatedAt = f.CreatedAt,
        UpdatedAt = f.UpdatedAt
    };

    [HttpGet]
    public async Task<ActionResult<IEnumerable<FieldDto>>> GetFields([FromQuery] Guid? farmId)
    {
        var query = _context.Fields.AsQueryable();
        if (farmId.HasValue) query = query.Where(f => f.FarmId == farmId.Value);

        var fields = await query.ToListAsync();
        return fields.Select(ToDto).ToList();
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<FieldDto>> GetField(Guid id)
    {
        var field = await _context.Fields.FindAsync(id);
        if (field == null) return NotFound();
        return ToDto(field);
    }

    [HttpPost]
    public async Task<ActionResult<FieldDto>> CreateField(CreateFieldDto dto)
    {
        var farmExists = await _context.Farms.AnyAsync(f => f.Id == dto.FarmId);
        if (!farmExists) return BadRequest($"Farm with id {dto.FarmId} does not exist.");

        var field = new Field
        {
            Id = Guid.NewGuid(),
            FarmId = dto.FarmId,
            FieldName = dto.FieldName,
            AreaSize = dto.AreaSize,
            SoilType = dto.SoilType,
            BoundaryCoordinates = dto.BoundaryCoordinates,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Fields.Add(field);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetField), new { id = field.Id }, ToDto(field));
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateField(Guid id, UpdateFieldDto dto)
    {
        var field = await _context.Fields.FindAsync(id);
        if (field == null) return NotFound();

        field.FieldName = dto.FieldName;
        field.AreaSize = dto.AreaSize;
        field.SoilType = dto.SoilType;
        field.BoundaryCoordinates = dto.BoundaryCoordinates;
        field.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteField(Guid id)
    {
        var field = await _context.Fields.FindAsync(id);
        if (field == null) return NotFound();

        _context.Fields.Remove(field);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}