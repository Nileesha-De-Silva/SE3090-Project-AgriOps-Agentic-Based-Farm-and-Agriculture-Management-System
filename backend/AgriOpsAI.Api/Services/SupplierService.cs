using System.ComponentModel.DataAnnotations;
using AgriOpsAI.Api.Data;
using AgriOpsAI.Api.DTOs;
using AgriOpsAI.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace AgriOpsAI.Api.Services;

public class SupplierService(AgriOpsDbContext context)
{
    public async Task<List<SupplierDto>> GetAllAsync()
    {
        var suppliers = await context.Suppliers.AsNoTracking()
            .OrderBy(supplier => supplier.Name).ThenBy(supplier => supplier.Id)
            .ToListAsync();
        return suppliers.Select(ToDto).ToList();
    }

    public async Task<SupplierDto?> GetByIdAsync(Guid id)
    {
        var supplier = await context.Suppliers.AsNoTracking()
            .SingleOrDefaultAsync(supplier => supplier.Id == id);
        return supplier is null ? null : ToDto(supplier);
    }

    public async Task<SupplierDto> CreateAsync(SaveSupplierDto dto)
    {
        Validator.ValidateObject(dto, new ValidationContext(dto), true);
        var now = DateTime.UtcNow;
        var supplier = new Supplier { Id = Guid.NewGuid(), CreatedAt = now, UpdatedAt = now };
        Apply(supplier, dto);
        context.Suppliers.Add(supplier);
        await context.SaveChangesAsync();
        return ToDto(supplier);
    }

    public async Task<SupplierDto?> UpdateAsync(Guid id, SaveSupplierDto dto)
    {
        Validator.ValidateObject(dto, new ValidationContext(dto), true);
        var supplier = await context.Suppliers.FindAsync(id);
        if (supplier is null) return null;
        Apply(supplier, dto);
        supplier.UpdatedAt = DateTime.UtcNow;
        await context.SaveChangesAsync();
        return ToDto(supplier);
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        var supplier = await context.Suppliers.FindAsync(id);
        if (supplier is null) return false;
        if (await context.SupplierItems.AnyAsync(link => link.SupplierId == id)
            || await context.PurchaseRequests.AnyAsync(request => request.SupplierId == id)
            || await context.ReorderRecommendations.AnyAsync(r => r.SupplierId == id))
        {
            throw new InvalidOperationException("Cannot delete a supplier with linked items or purchase requests.");
        }
        context.Suppliers.Remove(supplier);
        try
        {
            await context.SaveChangesAsync();
        }
        catch (DbUpdateException exception) when (exception.InnerException is Npgsql.PostgresException
            { SqlState: Npgsql.PostgresErrorCodes.ForeignKeyViolation })
        {
            throw new InvalidOperationException("Cannot delete a supplier with linked items or purchase requests.", exception);
        }
        return true;
    }

    private static string? Clean(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    private static void Apply(Supplier supplier, SaveSupplierDto dto)
    {
        supplier.Name = dto.Name.Trim();
        supplier.ContactPerson = Clean(dto.ContactPerson);
        supplier.Phone = Clean(dto.Phone);
        supplier.Email = Clean(dto.Email);
        supplier.Address = Clean(dto.Address);
    }

    private static SupplierDto ToDto(Supplier supplier) => new()
    {
        Id = supplier.Id, Name = supplier.Name, ContactPerson = supplier.ContactPerson,
        Phone = supplier.Phone, Email = supplier.Email, Address = supplier.Address,
        CreatedAt = supplier.CreatedAt, UpdatedAt = supplier.UpdatedAt
    };
}
