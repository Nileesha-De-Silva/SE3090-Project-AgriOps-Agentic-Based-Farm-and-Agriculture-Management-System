using AgriOpsAI.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace AgriOpsAI.Api.Services;

public class InventoryBatchService(AgriOpsDbContext context)
{
    public async Task<object?> GetAsync(Guid id)
    {
        var batch = await context.InventoryBatches.AsNoTracking().SingleOrDefaultAsync(b => b.Id == id);
        var purchase = batch is null ? await context.PurchaseRequests.AsNoTracking().SingleOrDefaultAsync(p => p.Id == id && (p.Status == "Approved" || p.Status == "Received")) : null;
        if (batch is null && purchase is null) return null;
        var itemId = batch?.InventoryItemId ?? purchase!.InventoryItemId;
        var item = await context.InventoryItems.AsNoTracking().SingleAsync(i => i.Id == itemId);
        var supplierId = batch?.SupplierId ?? purchase?.SupplierId;
        var supplier = supplierId is null ? null : await context.Suppliers.AsNoTracking().SingleOrDefaultAsync(s => s.Id == supplierId);
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var next = await context.InventoryBatches.AsNoTracking()
            .Where(b => b.InventoryItemId == itemId && b.RemainingQuantity > 0 && (b.ExpirationDate == null || b.ExpirationDate >= today))
            .OrderBy(b => b.ReceivedAt).ThenBy(b => b.Id)
            .Select(b => (Guid?)b.Id).FirstOrDefaultAsync();
        var expired = batch?.ExpirationDate < today;
        return new {
            id, inventoryItemId = itemId, itemName = item.Name, category = item.Category,
            unitOfMeasurement = item.UnitOfMeasurement, totalItemStock = item.CurrentStock,
            supplierName = supplier?.Name, batchNumber = batch?.BatchNumber, shelfLocation = batch?.ShelfLocation,
            expirationDate = batch?.ExpirationDate, receivedAt = batch?.ReceivedAt,
            receivedQuantity = batch?.ReceivedQuantity ?? 0m, remainingQuantity = batch is null && purchase?.Status == "Received" ? (decimal?)null : batch?.RemainingQuantity ?? 0m,
            requestedQuantity = purchase?.RequestedQuantity, isLegacy = batch?.IsLegacy ?? false,
            status = batch is null ? purchase?.Status == "Received" ? "Historical receipt — batch not tracked" : "Awaiting receipt" : expired ? "Expired" : batch.RemainingQuantity == 0 ? "Depleted" : "Available",
            nextBatchId = next, isNextToIssue = batch is not null && next == id,
            canIssue = batch is not null && !expired && batch.RemainingQuantity > 0 && next == id,
            qrPayload = $"agriops:batch:{id:D}"
        };
    }

    public async Task<bool> UpdateAsync(Guid id, DateOnly? expirationDate, string? batchNumber, string? shelfLocation)
    {
        var itemId = await context.InventoryBatches.AsNoTracking().Where(b => b.Id == id).Select(b => (Guid?)b.InventoryItemId).SingleOrDefaultAsync();
        if (itemId is null) return false;
        await using var transaction = await context.Database.BeginTransactionAsync();
        await context.InventoryItems.FromSqlInterpolated($"SELECT * FROM \"InventoryItems\" WHERE \"Id\" = {itemId.Value} FOR UPDATE").AsTracking().ToListAsync();
        var batch = await context.InventoryBatches.SingleAsync(b => b.Id == id);
        batch.ExpirationDate = expirationDate;
        batch.BatchNumber = string.IsNullOrWhiteSpace(batchNumber) ? null : batchNumber.Trim();
        batch.ShelfLocation = string.IsNullOrWhiteSpace(shelfLocation) ? null : shelfLocation.Trim();
        batch.UpdatedAt = DateTime.UtcNow;
        await context.SaveChangesAsync();
        await transaction.CommitAsync();
        return true;
    }

    public async Task<List<object>> ListAsync(Guid itemId)
    {
        var ids = await context.InventoryBatches.AsNoTracking().Where(b => b.InventoryItemId == itemId)
            .OrderBy(b => b.ReceivedAt).Select(b => b.Id).ToListAsync();
        var result = new List<object>();
        foreach (var id in ids) { var batch = await GetAsync(id); if (batch is not null) result.Add(batch); }
        return result;
    }
}
