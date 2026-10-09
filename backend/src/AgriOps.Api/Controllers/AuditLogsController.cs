using AgriOpsAI.Api.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AgriOpsAI.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Administrator")]
public class AuditLogsController : ControllerBase
{
    private readonly AgriOpsDbContext _db;

    public AuditLogsController(AgriOpsDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> GetAuditLogs(
        [FromQuery] string? actionType,
        [FromQuery] Guid? userId,
        [FromQuery] int skip = 0,
        [FromQuery] int take = 50)
    {
        var query = _db.AuditLogs.AsQueryable();

        if (!string.IsNullOrWhiteSpace(actionType))
            query = query.Where(a => a.ActionType == actionType);

        if (userId.HasValue)
            query = query.Where(a => a.UserId == userId);

        var logs = await query
            .OrderByDescending(a => a.Timestamp)
            .Skip(skip)
            .Take(Math.Min(take, 200))
            .ToListAsync();

        return Ok(logs);
    }
}