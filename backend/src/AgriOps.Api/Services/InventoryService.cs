using System.ComponentModel.DataAnnotations;
using AgriOpsAI.Api.Data;
using AgriOpsAI.Api.DTOs;
using AgriOpsAI.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace AgriOpsAI.Api.Services;

public class InventoryService
{
    private readonly AgriOpsDbContext _context;

    public InventoryService(AgriOpsDbContext context)
    {
        _context = context;
    }

    public async Task<List<InventoryItemDto>> GetAllAsync()
    {
        var items = await _context.InventoryItems
            .AsNoTracking()
            .OrderBy(item => item.Name)
            .ThenBy(item => item.Id)
            .ToListAsync();

        return items.Select(ToDto).ToList();
    }

    public async Task<List<InventoryItemDto>> GetLowStockAsync()
    {
        var items = await _context.InventoryItems
            .AsNoTracking()
            .Where(item => item.CurrentStock < item.MinimumStockLevel)
            .OrderByDescending(item => item.MinimumStockLevel - item.CurrentStock)
            .ThenBy(item => item.Name)
            .ThenBy(item => item.Id)
            .ToListAsync();

        return items.Select(ToDto).ToList();
    }

    public async Task<InventoryItemDto?> GetByIdAsync(Guid id)
    {
        var item = await _context.InventoryItems
            .AsNoTracking()
            .FirstOrDefaultAsync(item => item.Id == id);

        return item is null ? null : ToDto(item);
    }

    public async Task<InventoryItemDto> CreateAsync(
        CreateInventoryItemDto dto)
    {
        Validator.ValidateObject(
            dto,
            new ValidationContext(dto),
            validateAllProperties: true);

        var minimumStockLevel = dto.MinimumStockLevel!.Value;
        var unitCost = dto.UnitCost!.Value;

        if (decimal.Round(minimumStockLevel, 2) != minimumStockLevel ||
            decimal.Round(unitCost, 2) != unitCost)
        {
            throw new ValidationException(
                "Minimum stock level and unit cost must have at most two decimal places.");
        }

        var now = DateTime.UtcNow;

        var item = new InventoryItem
        {
            Id = Guid.NewGuid(),
            Name = dto.Name.Trim(),
            Category = dto.Category.Trim(),
            UnitOfMeasurement = dto.UnitOfMeasurement.Trim(),
            CurrentStock = 0,
            MinimumStockLevel = minimumStockLevel,
            UnitCost = unitCost,
            CreatedAt = now,
            UpdatedAt = now
        };

        _context.InventoryItems.Add(item);
        await _context.SaveChangesAsync();

        return ToDto(item);
    }

    public async Task<InventoryItemDto?> UpdateAsync(
    Guid id,
    UpdateInventoryItemDto dto)
    {
    Validator.ValidateObject(
        dto,
        new ValidationContext(dto),
        validateAllProperties: true);

    var minimumStockLevel = dto.MinimumStockLevel!.Value;
    var unitCost = dto.UnitCost!.Value;

    if (decimal.Round(minimumStockLevel, 2) != minimumStockLevel ||
        decimal.Round(unitCost, 2) != unitCost)
    {
        throw new ValidationException(
            "Minimum stock level and unit cost must have at most two decimal places.");
    }

    var item = await _context.InventoryItems.FindAsync(id);

    if (item is null)
    {
        return null;
    }

    var unit = dto.UnitOfMeasurement.Trim();

    if (!string.Equals(
            item.UnitOfMeasurement,
            unit,
            StringComparison.OrdinalIgnoreCase))
    {
        var hasRelatedRecords =
            await _context.InventoryTransactions
                .AnyAsync(transaction => transaction.InventoryItemId == id)
            || await _context.SupplierItems
                .AnyAsync(supplierItem => supplierItem.InventoryItemId == id)
            || await _context.PurchaseRequests
                .AnyAsync(request => request.InventoryItemId == id)
            || await _context.ReorderRecommendations.AnyAsync(r => r.InventoryItemId == id);

        if (item.CurrentStock != 0 || hasRelatedRecords)
        {
            throw new InvalidOperationException(
                "The unit cannot be changed when the item has stock or related records.");
        }

        item.UnitOfMeasurement = unit;
    }

    item.Name = dto.Name.Trim();
    item.Category = dto.Category.Trim();
    item.MinimumStockLevel = minimumStockLevel;
    item.UnitCost = unitCost;
    item.UpdatedAt = DateTime.UtcNow;

    await _context.SaveChangesAsync();

    return ToDto(item);
    }


    // deletion for unused inventory items
        public async Task<bool> DeleteAsync(Guid id)
    {
        var item = await _context.InventoryItems
            .FirstOrDefaultAsync(item => item.Id == id);

        if (item is null)
        {
            return false;
        }

        var hasTransactions = await _context.InventoryTransactions
            .AnyAsync(transaction => transaction.InventoryItemId == id);

        var hasSupplierLinks = await _context.SupplierItems
            .AnyAsync(link => link.InventoryItemId == id);

        var hasPurchaseRequests = await _context.PurchaseRequests
            .AnyAsync(request => request.InventoryItemId == id);

        if (item.CurrentStock != 0 ||
            hasTransactions ||
            hasSupplierLinks ||
            hasPurchaseRequests || await _context.ReorderRecommendations.AnyAsync(r => r.InventoryItemId == id))
        {
            throw new InvalidOperationException(
                "Cannot delete an item that has stock or related records.");
        }

        _context.InventoryItems.Remove(item);

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateException exception)
            when (exception.InnerException is Npgsql.PostgresException
            {
                SqlState: Npgsql.PostgresErrorCodes.ForeignKeyViolation
            })
        {
            throw new InvalidOperationException(
                "Cannot delete this item because related records exist.",
                exception);
        }

        return true;
    }

    private static InventoryItemDto ToDto(InventoryItem item)
    {
        return new InventoryItemDto
        {
            Id = item.Id,
            Name = item.Name,
            Category = item.Category,
            UnitOfMeasurement = item.UnitOfMeasurement,
            CurrentStock = item.CurrentStock,
            MinimumStockLevel = item.MinimumStockLevel,
            UnitCost = item.UnitCost,
            CreatedAt = item.CreatedAt,
            UpdatedAt = item.UpdatedAt
        };
    }
}
