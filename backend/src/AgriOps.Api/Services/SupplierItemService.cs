using System.ComponentModel.DataAnnotations;
using AgriOpsAI.Api.Data;
using AgriOpsAI.Api.DTOs;
using AgriOpsAI.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace AgriOpsAI.Api.Services;

public class SupplierItemService(AgriOpsDbContext context)
{
    public async Task<List<SupplierItemDto>?> GetAllAsync(Guid supplierId)
    {
        if (!await context.Suppliers.AnyAsync(s => s.Id == supplierId)) return null;
        var links = await context.SupplierItems.AsNoTracking()
            .Where(link => link.SupplierId == supplierId)
            .OrderBy(link => link.InventoryItemId).ToListAsync();
        return links.Select(ToDto).ToList();
    }

    public async Task<SupplierItemDto?> GetAsync(Guid supplierId, Guid itemId)
    {
        var link = await context.SupplierItems.AsNoTracking()
            .SingleOrDefaultAsync(link => link.SupplierId == supplierId && link.InventoryItemId == itemId);
        return link is null ? null : ToDto(link);
    }

    public async Task<SupplierItemDto?> SaveAsync(Guid supplierId, Guid itemId, SaveSupplierItemDto dto, bool create)
    {
        Validator.ValidateObject(dto, new ValidationContext(dto), true);
        if (decimal.Round(dto.UnitPrice!.Value, 2) != dto.UnitPrice.Value)
            throw new ValidationException("Unit price must have at most two decimal places.");

        if (!await context.Suppliers.AnyAsync(s => s.Id == supplierId)
            || !await context.InventoryItems.AnyAsync(i => i.Id == itemId)) return null;

        var link = await context.SupplierItems.SingleOrDefaultAsync(
            link => link.SupplierId == supplierId && link.InventoryItemId == itemId);
        if (create && link is not null)
            throw new InvalidOperationException("This supplier is already linked to the inventory item.");
        if (!create && link is null) return null;

        var now = DateTime.UtcNow;
        if (link is null)
        {
            link = new SupplierItem
            {
                Id = Guid.NewGuid(), SupplierId = supplierId, InventoryItemId = itemId,
                CreatedAt = now
            };
            context.SupplierItems.Add(link);
        }
        link.UnitPrice = dto.UnitPrice.Value;
        link.LeadTimeDays = dto.LeadTimeDays!.Value;
        link.IsAvailable = dto.IsAvailable!.Value;
        link.UpdatedAt = now;
        try
        {
            await context.SaveChangesAsync();
        }
        catch (DbUpdateException exception) when (exception.InnerException is Npgsql.PostgresException
            { SqlState: Npgsql.PostgresErrorCodes.UniqueViolation })
        {
            throw new InvalidOperationException("This supplier is already linked to the inventory item.", exception);
        }
        catch (DbUpdateException exception) when (exception.InnerException is Npgsql.PostgresException
            { SqlState: Npgsql.PostgresErrorCodes.ForeignKeyViolation })
        {
            throw new InvalidOperationException("The supplier or inventory item no longer exists.", exception);
        }
        return ToDto(link);
    }

    public async Task<bool> DeleteAsync(Guid supplierId, Guid itemId)
    {
        var link = await context.SupplierItems.SingleOrDefaultAsync(
            link => link.SupplierId == supplierId && link.InventoryItemId == itemId);
        if (link is null) return false;
        context.SupplierItems.Remove(link);
        await context.SaveChangesAsync();
        return true;
    }

    private static SupplierItemDto ToDto(SupplierItem link) => new()
    {
        Id = link.Id, SupplierId = link.SupplierId, InventoryItemId = link.InventoryItemId,
        UnitPrice = link.UnitPrice, LeadTimeDays = link.LeadTimeDays, IsAvailable = link.IsAvailable,
        CreatedAt = link.CreatedAt, UpdatedAt = link.UpdatedAt
    };
}
