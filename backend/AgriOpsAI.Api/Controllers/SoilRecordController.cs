using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AgriOpsAI.Api.Data;
using AgriOpsAI.Api.Models;

namespace AgriOpsAI.Api.Controllers;

[ApiController]
[Route("api/field/{fieldId}/[controller]")]
public class SoilRecordController : ControllerBase
{
    private readonly AgriOpsDbContext _context;

    public SoilRecordController(AgriOpsDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<SoilRecord>>> GetSoilRecords(Guid fieldId)
    {
        return await _context.SoilRecords
            .Where(sr => sr.FieldId == fieldId)
            .OrderByDescending(sr => sr.TestDate)
            .ToListAsync();
    }

    [HttpPost]
    public async Task<ActionResult<SoilRecord>> CreateSoilRecord(Guid fieldId, SoilRecord soilRecord)
    {
        var fieldExists = await _context.Fields.AnyAsync(f => f.Id == fieldId);
        if (!fieldExists) return BadRequest($"Field with id {fieldId} does not exist.");

        soilRecord.Id = Guid.NewGuid();
        soilRecord.FieldId = fieldId;

        _context.SoilRecords.Add(soilRecord);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetSoilRecords), new { fieldId }, soilRecord);
    }
}