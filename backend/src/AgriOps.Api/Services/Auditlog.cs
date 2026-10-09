using AgriOpsAI.Api.Data;
using AgriOpsAI.Api.Models;

namespace AgriOpsAI.Api.Services;

// For events that don't correspond to a database entity change
// (e.g. a login attempt) and so wouldn't be caught by AuditLogInterceptor.
public class AuditLogService : IAuditLogService
{
    private readonly AgriOpsDbContext _db;
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly Microsoft.Extensions.Logging.ILogger<AuditLogService> _logger;

    public AuditLogService(
        AgriOpsDbContext db,
        IHttpContextAccessor httpContextAccessor,
        Microsoft.Extensions.Logging.ILogger<AuditLogService> logger)
    {
        _db = db;
        _httpContextAccessor = httpContextAccessor;
        _logger = logger;
    }

    public async Task LogAsync(Guid? userId, string actionType, string? details = null)
    {
        try
        {
            _db.AuditLogs.Add(new AuditLog
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                EntityName = "System",
                Action = actionType,
                ActionType = actionType,
                IpAddress = _httpContextAccessor.HttpContext?.Connection?.RemoteIpAddress?.ToString(),
                Details = details,
                Timestamp = DateTime.UtcNow
            });

            await _db.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to persist audit log entry to database: {ActionType}", actionType);
        }
    }
}