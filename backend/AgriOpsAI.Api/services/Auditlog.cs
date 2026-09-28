using AgriOpsAI.Api.Data;
using AgriOpsAI.Api.Models;

namespace AgriOpsAI.Api.Services;

// For events that don't correspond to a database entity change
// (e.g. a login attempt) and so wouldn't be caught by AuditLogInterceptor.
public class AuditLogService : IAuditLogService
{
    private readonly AgriOpsDbContext _db;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public AuditLogService(AgriOpsDbContext db, IHttpContextAccessor httpContextAccessor)
    {
        _db = db;
        _httpContextAccessor = httpContextAccessor;
    }

    public async Task LogAsync(Guid? userId, string actionType, string? details = null)
    {
        _db.AuditLogs.Add(new AuditLog
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            ActionType = actionType,
            IpAddress = _httpContextAccessor.HttpContext?.Connection?.RemoteIpAddress?.ToString(),
            Details = details,
            Timestamp = DateTime.UtcNow
        });

        await _db.SaveChangesAsync();
    }
}