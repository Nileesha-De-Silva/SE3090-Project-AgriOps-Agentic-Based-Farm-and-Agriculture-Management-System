using AgriOpsAI.Api.Data;
using AgriOpsAI.Api.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AgriOpsAI.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Administrator,FarmManager")]
public class AnalyticsController : ControllerBase
{
    private readonly AgriOpsDbContext _db;

    public AnalyticsController(AgriOpsDbContext db)
    {
        _db = db;
    }

    // GET /api/analytics/harvest-yields
    // "Historical Production Trends": seasonal harvest yields per field, per crop.
    // Returns raw rows rather than a pre-baked shape - the frontend can group by
    // field, by crop, or over time depending on which chart it's building.
    //
    // NOTE: Worker workload and inventory/water-efficiency analytics from the
    // letter aren't here yet - those need Worker/FarmTask (Component 2) and
    // InventoryItem/InventoryTransaction (Component 3) tables, which don't
    // exist in the schema yet. Add those once those components land.
    [HttpGet("harvest-yields")]
    public async Task<IActionResult> GetHarvestYields()
    {
        var results = await _db.Harvests
            .Include(h => h.CropSeason).ThenInclude(cs => cs.Field)
            .Include(h => h.CropSeason).ThenInclude(cs => cs.Crop)
            .GroupBy(h => new
            {
                h.CropSeason.FieldId,
                h.CropSeason.Field.FieldName,
                h.CropSeasonId,
                h.CropSeason.SeasonName,
                h.CropSeason.StartDate,
                CropName = h.CropSeason.Crop.CropName
            })
            .Select(g => new SeasonYieldDto(
                g.Key.FieldId,
                g.Key.FieldName,
                g.Key.CropSeasonId,
                g.Key.SeasonName,
                g.Key.StartDate,
                g.Key.CropName,
                g.Sum(h => h.YieldAmount)))
            .OrderBy(d => d.StartDate)
            .ToListAsync();

        return Ok(results);
    }
}