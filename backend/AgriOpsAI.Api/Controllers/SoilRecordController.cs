using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AgriOpsAI.Api.Data;
using AgriOpsAI.Api.Models;
using AgriOpsAI.Api.DTOs;

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

    private static SoilRecordDto ToDto(SoilRecord sr) => new()
    {
        Id = sr.Id,
        FieldId = sr.FieldId,
        TestDate = sr.TestDate,
        PhLevel = sr.PhLevel,
        NitrogenLevel = sr.NitrogenLevel,
        PhosphorusLevel = sr.PhosphorusLevel,
        PotassiumLevel = sr.PotassiumLevel,
        Notes = sr.Notes
    };

    [HttpGet]
    public async Task<ActionResult<IEnumerable<SoilRecordDto>>> GetSoilRecords(Guid fieldId)
    {
        var records = await _context.SoilRecords
            .Where(sr => sr.FieldId == fieldId)
            .OrderByDescending(sr => sr.TestDate)
            .ToListAsync();
        return records.Select(ToDto).ToList();
    }

    [HttpPost]
    public async Task<ActionResult<SoilRecordDto>> CreateSoilRecord(Guid fieldId, CreateSoilRecordDto dto)
    {
        var fieldExists = await _context.Fields.AnyAsync(f => f.Id == fieldId);
        if (!fieldExists) return BadRequest($"Field with id {fieldId} does not exist.");

        var soilRecord = new SoilRecord
        {
            Id = Guid.NewGuid(),
            FieldId = fieldId,
            TestDate = dto.TestDate,
            PhLevel = dto.PhLevel,
            NitrogenLevel = dto.NitrogenLevel,
            PhosphorusLevel = dto.PhosphorusLevel,
            PotassiumLevel = dto.PotassiumLevel,
            Notes = dto.Notes
        };

        _context.SoilRecords.Add(soilRecord);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetSoilRecords), new { fieldId }, ToDto(soilRecord));
    }
}