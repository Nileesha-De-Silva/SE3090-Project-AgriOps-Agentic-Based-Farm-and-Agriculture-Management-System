using AgriOpsAI.Api.Data;
using AgriOpsAI.Api.DTOs;
using AgriOpsAI.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace AgriOpsAI.Api.Services;

// Purchase requests are created only inside recommendation approval's transaction.
public class PurchaseRequestService(AgriOpsDbContext context, InventoryTransactionService movements)
{
    public async Task<List<PurchaseRequestDto>> GetAllAsync()
        => (await context.PurchaseRequests.AsNoTracking().OrderByDescending(r => r.RequestedAt)
            .ThenByDescending(r => r.Id).ToListAsync()).Select(ToDto).ToList();

    public async Task<PurchaseRequestDto?> GetByIdAsync(Guid id)
    {
        var request = await context.PurchaseRequests.AsNoTracking().SingleOrDefaultAsync(r => r.Id == id);
        return request is null ? null : ToDto(request);
    }

    // Full deliveries only. A purchase lock serializes double-clicks and concurrent receipts.
    public async Task<PurchaseRequestDto?> ReceiveAsync(Guid id, string? notes, DateOnly? expirationDate = null, string? batchNumber = null, string? shelfLocation = null)
    {
        await using var transaction = await context.Database.BeginTransactionAsync();
        var rows = await context.PurchaseRequests.FromSqlInterpolated(
            $"SELECT * FROM \"PurchaseRequests\" WHERE \"Id\" = {id} FOR UPDATE").AsTracking().ToListAsync();
        var purchase = rows.SingleOrDefault();
        if (purchase is null) return null;
        if (purchase.Status != "Approved")
            throw new InvalidOperationException("Only an approved, unreceived purchase request can be received.");
        var movement = await movements.CreateAsync(purchase.InventoryItemId, new CreateInventoryTransactionDto {
            TransactionType = "Receive", Quantity = purchase.RequestedQuantity,
            ExpirationDate = expirationDate, BatchNumber = batchNumber, ShelfLocation = shelfLocation,
            Notes = $"Purchase receipt {purchase.Id:D}" + (string.IsNullOrWhiteSpace(notes) ? "" : $": {notes.Trim()}")
        }, purchase.Id, purchase.SupplierId);
        if (movement is null) throw new InvalidOperationException("The inventory item no longer exists.");
        purchase.Status = "Received";
        purchase.UpdatedAt = DateTime.UtcNow;
        await context.SaveChangesAsync();
        await transaction.CommitAsync();
        return ToDto(purchase);
    }

    private static PurchaseRequestDto ToDto(PurchaseRequest r) => new()
    {
        Id = r.Id, InventoryItemId = r.InventoryItemId, SupplierId = r.SupplierId,
        RequestedQuantity = r.RequestedQuantity, Reason = r.Reason, Status = r.Status,
        RequestedAt = r.RequestedAt, ApprovedAt = r.ApprovedAt, CreatedAt = r.CreatedAt, UpdatedAt = r.UpdatedAt
    };
}
