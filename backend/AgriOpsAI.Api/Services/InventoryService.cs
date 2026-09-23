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

    public async Task<List<InventoryItemDto>> GetAllAsync() //This declares a method
    {
        var items = await _context.InventoryItems
            .AsNoTracking()
            .OrderBy(item => item.Name)
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