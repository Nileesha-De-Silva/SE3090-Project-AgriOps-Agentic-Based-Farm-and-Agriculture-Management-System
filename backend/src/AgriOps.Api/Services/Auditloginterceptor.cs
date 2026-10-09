using System.IdentityModel.Tokens.Jwt;
using AgriOpsAI.Api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.Diagnostics;

namespace AgriOpsAI.Api.Services;

// Automatically writes an AuditLog row for every Add/Modify/Delete that flows
// through SaveChanges, so individual controllers/services don't have to
// remember to log CRUD operations by hand. Events with no entity change
// (e.g. a login) still need to be logged explicitly via IAuditLogService.
public class AuditLogInterceptor : SaveChangesInterceptor
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    // Never write these into the Details JSON blob
    private static readonly HashSet<string> ExcludedProperties = new() { "PasswordHash" };

    public AuditLogInterceptor(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public override ValueTask<InterceptionResult<int>> SavingChangesAsync(
        DbContextEventData eventData,
        InterceptionResult<int> result,
        CancellationToken cancellationToken = default)
    {
        if (eventData.Context is not null)
        {
            try
            {
                AddAuditEntries(eventData.Context);
            }
            catch
            {
                // Never block primary transactional operations due to interceptor audit logging
            }
        }

        return base.SavingChangesAsync(eventData, result, cancellationToken);
    }

    private void AddAuditEntries(DbContext context)
    {
        var userId = GetCurrentUserId();
        var ipAddress = _httpContextAccessor.HttpContext?.Connection?.RemoteIpAddress?.ToString();

        // Materialize first — adding AuditLog rows below would otherwise mutate
        // the ChangeTracker while we're still iterating over it.
        var entries = context.ChangeTracker.Entries()
            .Where(e => e.Entity is not AuditLog
                        && (e.State == EntityState.Added
                            || e.State == EntityState.Modified
                            || e.State == EntityState.Deleted))
            .ToList();

        foreach (var entry in entries)
        {
            var entityName = entry.Entity.GetType().Name;
            var actionType = entry.State switch
            {
                EntityState.Added => $"{entityName.ToUpperInvariant()}_CREATED",
                EntityState.Modified => $"{entityName.ToUpperInvariant()}_UPDATED",
                EntityState.Deleted => $"{entityName.ToUpperInvariant()}_DELETED",
                _ => $"{entityName.ToUpperInvariant()}_CHANGED"
            };

            context.Set<AuditLog>().Add(new AuditLog
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                EntityName = entityName,
                Action = actionType,
                ActionType = actionType,
                IpAddress = ipAddress,
                Details = BuildDetails(entry),
                Timestamp = DateTime.UtcNow
            });
        }
    }

    private static string BuildDetails(EntityEntry entry)
    {
        var changes = new Dictionary<string, object?>();

        foreach (var prop in entry.Properties)
        {
            var name = prop.Metadata.Name;
            if (ExcludedProperties.Contains(name)) continue;

            changes[name] = entry.State == EntityState.Modified && prop.IsModified
                ? new { Old = prop.OriginalValue, New = prop.CurrentValue }
                : prop.CurrentValue;
        }

        return System.Text.Json.JsonSerializer.Serialize(changes);
    }

    private Guid? GetCurrentUserId()
    {
        var sub = _httpContextAccessor.HttpContext?.User?.FindFirst(JwtRegisteredClaimNames.Sub)?.Value;
        return Guid.TryParse(sub, out var id) ? id : null;
    }
}