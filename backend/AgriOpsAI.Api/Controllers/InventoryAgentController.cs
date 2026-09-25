using System.Data;
using System.Security.Claims;
using AgriOpsAI.Api.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AgriOpsAI.Api.Controllers;

[ApiController]
[Route("api/inventory-agent")]
public class InventoryAgentController(AgriOpsDbContext context) : ControllerBase
{
    [Authorize(Policy = "Manager")]
    [HttpGet("access")]
    public IActionResult Access() => Ok(new { subject = User.FindFirstValue("sub"), issuer = User.FindFirstValue("iss") });

    [Authorize(Policy = "RecommendationReader")]
    [HttpGet("items/{id:guid}/context")]
    public async Task<IActionResult> GetContext(Guid id)
    {
        // Read one consistent database snapshot for the model's evidence.
        await using var transaction = await context.Database.BeginTransactionAsync(IsolationLevel.RepeatableRead);
        var item = await context.InventoryItems.AsNoTracking().SingleOrDefaultAsync(i => i.Id == id);
        if (item is null) return NotFound(new { message = "Inventory item not found." });
        var offers = await context.SupplierItems.AsNoTracking().Where(l => l.InventoryItemId == id && l.IsAvailable)
            .OrderBy(l => l.UnitPrice).ThenBy(l => l.LeadTimeDays).ThenBy(l => l.SupplierId)
            .Select(l => new { l.SupplierId, supplierName = l.Supplier.Name, l.UnitPrice, l.LeadTimeDays })
            .Take(21).ToListAsync();
        var incoming = await context.PurchaseRequests.Where(r => r.InventoryItemId == id &&
            (r.Status == "Approved" || r.Status == "Pending"))
            .SumAsync(r => (decimal?)r.RequestedQuantity) ?? 0;
        var pending = await context.ReorderRecommendations.Where(r => r.InventoryItemId == id && r.Status == "Pending")
            .Select(r => (Guid?)r.Id).SingleOrDefaultAsync();
        var since = DateTime.UtcNow.AddDays(-30);
        var usage = await context.InventoryTransactions.Where(t => t.InventoryItemId == id && t.TransactionType == "Use" && t.TransactionDate >= since)
            .SumAsync(t => (decimal?)t.Quantity) ?? 0;
        await transaction.CommitAsync();
        return Ok(new
        {
            item = new { item.Id, item.Name, item.CurrentStock, item.MinimumStockLevel, item.UnitOfMeasurement },
            incomingQuantity = incoming, pendingRecommendationId = pending, usageLast30Days = usage,
            offers = offers.Take(20), offersTruncated = offers.Count > 20
        });
    }
}
