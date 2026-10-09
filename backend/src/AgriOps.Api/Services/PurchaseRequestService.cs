using AgriOpsAI.Api.Data;
using AgriOpsAI.Api.DTOs;
using AgriOpsAI.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace AgriOpsAI.Api.Services;

// Purchase requests are created only inside recommendation approval's transaction.
public class PurchaseRequestService(AgriOpsDbContext context)
{
    public async Task<List<PurchaseRequestDto>> GetAllAsync()
        => (await context.PurchaseRequests.AsNoTracking().OrderByDescending(r => r.RequestedAt)
            .ThenByDescending(r => r.Id).ToListAsync()).Select(ToDto).ToList();

    public async Task<PurchaseRequestDto?> GetByIdAsync(Guid id)
    {
        var request = await context.PurchaseRequests.AsNoTracking().SingleOrDefaultAsync(r => r.Id == id);
        return request is null ? null : ToDto(request);
    }

    private static PurchaseRequestDto ToDto(PurchaseRequest r) => new()
    {
        Id = r.Id, InventoryItemId = r.InventoryItemId, SupplierId = r.SupplierId,
        RequestedQuantity = r.RequestedQuantity, Reason = r.Reason, Status = r.Status,
        RequestedAt = r.RequestedAt, ApprovedAt = r.ApprovedAt, CreatedAt = r.CreatedAt, UpdatedAt = r.UpdatedAt
    };
}
