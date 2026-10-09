namespace AgriOpsAI.Api.Services;

public interface IAuditLogService
{
    Task LogAsync(Guid? userId, string actionType, string? details = null);
}