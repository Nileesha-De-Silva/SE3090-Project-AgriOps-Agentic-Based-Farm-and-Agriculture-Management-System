using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AgriOpsAI.Api.Data;
using AgriOpsAI.Api.Models;

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


    [HttpGet]
    public async Task<ActionResult<IEnumerable<Field>>> GetFields([FromQuery] Guid? farmId)
    {
        var query = _context.Fields.AsQueryable();

        if (farmId.HasValue)
        {
            query = query.Where(f => f.FarmId == farmId.Value);
        }

        return await query.ToListAsync();
    }


    [HttpGet("{id}")]
    public async Task<ActionResult<Field>> GetField(Guid id)
    {
        var field = await _context.Fields.FindAsync(id);
        if (field == null) return NotFound();
        return field;
    }

    [HttpPost]
    public async Task<ActionResult<Field>> CreateField(Field field)
    {
        var farmExists = await _context.Farms.AnyAsync(f => f.Id == field.FarmId);
        if (!farmExists)
        {
            return BadRequest($"Farm with id {field.FarmId} does not exist.");
        }

        field.Id = Guid.NewGuid();
        field.CreatedAt = DateTime.UtcNow;
        field.UpdatedAt = DateTime.UtcNow;

        _context.Fields.Add(field);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetField), new { id = field.Id }, field);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateField(Guid id, Field field)
    {
        if (id != field.Id) return BadRequest();

        var existingField = await _context.Fields.FindAsync(id);
        if (existingField == null) return NotFound();

        existingField.FieldName = field.FieldName;
        existingField.AreaSize = field.AreaSize;
        existingField.SoilType = field.SoilType;
        existingField.BoundaryCoordinates = field.BoundaryCoordinates;
        existingField.UpdatedAt = DateTime.UtcNow;

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