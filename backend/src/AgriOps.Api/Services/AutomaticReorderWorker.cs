using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using AgriOpsAI.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace AgriOpsAI.Api.Services;

// Reads committed stock movements, so restarts can recover eligible events.
// Provider failures never roll back or delay the user's stock transaction.
public sealed class AutomaticReorderWorker(IServiceScopeFactory scopes, IHttpClientFactory clients,
    IConfiguration configuration, ILogger<AutomaticReorderWorker> logger) : BackgroundService
{
    private readonly Dictionary<Guid, DateTime> retryAfter = new();
    private readonly Dictionary<Guid, Guid> checkedMovements = new();

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        if (!configuration.GetValue("InventoryAgent:AutomaticReorderEnabled", true)) return;
        while (!stoppingToken.IsCancellationRequested)
        {
            try { await CheckAsync(stoppingToken); }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested) { break; }
            catch (Exception ex) { logger.LogWarning("Automatic reorder scan failed ({Type}); will retry.", ex.GetType().Name); }
            try { await Task.Delay(TimeSpan.FromSeconds(30), stoppingToken); }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested) { break; }
        }
    }

    private async Task CheckAsync(CancellationToken ct)
    {
        var clientId = configuration["InventoryAgent:ClientId"];
        var secret = configuration["InventoryAgent:ClientSecret"];
        string? token = null;
        if (string.IsNullOrWhiteSpace(clientId) || string.IsNullOrWhiteSpace(secret))
        {
            logger.LogWarning("Automatic reorder needs dedicated InventoryAgent client credentials.");
            return;
        }
        var address = configuration["InventoryAgent:BaseUrl"] ?? "http://127.0.0.1:8003/";
        if (!Uri.TryCreate(address, UriKind.Absolute, out var origin) ||
            !(origin.Scheme == "https" || (origin.Scheme == "http" && (origin.IsLoopback || origin.Host == "inventory-agent"))) ||
            origin.UserInfo.Length != 0 || origin.Query.Length != 0 || origin.Fragment.Length != 0 || origin.AbsolutePath != "/")
            throw new InvalidOperationException("Invalid internal inventory-agent URL.");

        using var scope = scopes.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AgriOpsDbContext>();
        var identity = scope.ServiceProvider.GetRequiredService<InventoryServiceIdentity>();
        var issued = await identity.IssueAsync(clientId!, secret!, ct) as InventoryServiceToken;
        if (issued is null) return;
        token = issued.AccessToken;
        var now = DateTime.UtcNow;
        foreach (var id in retryAfter.Where(x => x.Value <= now).Select(x => x.Key).ToArray()) retryAfter.Remove(id);
        var since = now.AddDays(-28);
        var usage = await db.InventoryTransactions.AsNoTracking()
            .Where(t => t.TransactionType == "Use" && t.TransactionDate >= since && t.TransactionDate <= now)
            .GroupBy(t => t.InventoryItemId)
            .Select(g => new { Id = g.Key, Quantity = g.Sum(t => t.Quantity) })
            .ToListAsync(ct);
        foreach (var used in usage)
        {
            ct.ThrowIfCancellationRequested();
            var movement = await db.InventoryTransactions.AsNoTracking()
                .Where(t => t.InventoryItemId == used.Id && (t.TransactionType == "Use" || t.TransactionType == "Receive"))
                .OrderByDescending(t => t.TransactionDate).ThenByDescending(t => t.Id)
                .Select(t => new { t.Id, t.TransactionDate }).FirstOrDefaultAsync(ct);
            if (movement is null) continue;
            if (!AutomaticReorderRule.IsNewMovement(movement.Id, checkedMovements.GetValueOrDefault(used.Id))) continue;
            if (retryAfter.ContainsKey(used.Id)) continue;
            var item = await db.InventoryItems.AsNoTracking().SingleOrDefaultAsync(i => i.Id == used.Id, ct);
            if (item is null) continue;
            var incoming = await db.PurchaseRequests.Where(r => r.InventoryItemId == used.Id &&
                (r.Status == "Pending" || r.Status == "Approved")).SumAsync(r => (decimal?)r.RequestedQuantity, ct) ?? 0;
            var pending = await db.ReorderRecommendations.AnyAsync(r => r.InventoryItemId == used.Id && r.Status == "Pending", ct);
            // A manager's rejection is respected until another stock movement.
            var reviewed = await db.ReorderRecommendations.AnyAsync(r => r.InventoryItemId == used.Id && (r.DecidedAt ?? r.CreatedAt) >= movement.TransactionDate, ct);
            if (!AutomaticReorderRule.ShouldRequest(item.CurrentStock, used.Quantity, incoming, item.CreatedAt, now, pending, reviewed))
            {
                checkedMovements[used.Id] = movement.Id;
                continue;
            }
            retryAfter[used.Id] = now.AddMinutes(10);
            try
            {
                using var request = new HttpRequestMessage(HttpMethod.Post, new Uri(origin, "automatic/recommend"));
                request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
                request.Content = JsonContent.Create(new { request_id = Guid.NewGuid(), inventory_item_id = used.Id,
                    safety_days = 14, message = "Automatic check: stock is below two weeks of recorded usage. Compare available supplier prices and delivery times." });
                using var response = await clients.CreateClient("InventoryAgentGateway").SendAsync(request, ct);
                if (!response.IsSuccessStatusCode)
                {
                    logger.LogWarning("Automatic reorder for {Item} returned HTTP {Status}; retry after cooldown.", used.Id, (int)response.StatusCode);
                    continue;
                }
                using var payload = JsonDocument.Parse(await response.Content.ReadAsStringAsync(ct));
                var status = payload.RootElement.TryGetProperty("status", out var value) ? value.GetString() : "unknown";
                if (status is "awaiting_approval" or "no_action") checkedMovements[used.Id] = movement.Id;
                logger.LogInformation("Automatic reorder for {Item}: {Status}.", used.Id, status);
            }
            catch (OperationCanceledException) when (ct.IsCancellationRequested) { throw; }
            catch (Exception ex) { logger.LogWarning("Automatic reorder for {Item} failed ({Type}); will retry.", used.Id, ex.GetType().Name); }
        }
    }
}
