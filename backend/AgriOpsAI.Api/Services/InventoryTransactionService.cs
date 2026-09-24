using System.ComponentModel.DataAnnotations;
using AgriOpsAI.Api.Data;
using AgriOpsAI.Api.DTOs;
using AgriOpsAI.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace AgriOpsAI.Api.Services;

public class InventoryTransactionService
{
    private readonly AgriOpsDbContext _context;

    public InventoryTransactionService(AgriOpsDbContext context)
    {
        _context = context;

    }

    public async Task<InventoryTransactionDto?> CreateAsync(
      Guid inventoryItemId,
      CreateInventoryTransactionDto dto)
   {

    Validator.ValidateObject(
      dto,
      new ValidationContext(dto),
      validateAllProperties: true);

      var quantity = dto.Quantity!.Value;

      if (decimal.Round(quantity, 2) != quantity)
      {
        throw new ValidationException(
          "Quantity must have at most two decimal places.");
      }

      await using var databaseTransaction = 
          await _context.Database.BeginTransactionAsync();

       // Lock this item until the transaction completes.
      // The interpolated ID is passed as a SQL parameter.
    
      var items = await _context.InventoryItems
        .FromSqlInterpolated(
          $"""
          SELECT * FROM "InventoryItems"
          WHERE "Id" = {inventoryItemId}
          FOR UPDATE
          """ )
          .AsTracking()
          .ToListAsync();

      var item = items.SingleOrDefault();

      if (item is null)
    {
        return null;
    }    

    decimal newStock;

    if(dto.TransactionType == "Receive")
    {
      newStock = item.CurrentStock + quantity;

      if (newStock > 99999999.99m)
      {
          throw new InvalidOperationException(
              "Receiving this quantity would exceed the stock limit."
          );
      }
    }
    else
    {
      if (quantity > item.CurrentStock)
      {
        throw new InvalidOperationException(
            "Insufficient stock for this usage. "
        );
      }

      newStock = item.CurrentStock - quantity;
    }

    var now = DateTime.UtcNow;

    var stockTransaction = new InventoryTransaction
    {
        Id = Guid.NewGuid(),
        InventoryItemId = inventoryItemId,
        TransactionType = dto.TransactionType,
        Quantity = quantity,
        Notes = string.IsNullOrWhiteSpace(dto.Notes)
            ?null
            : dto.Notes.Trim(),
        TransactionDate = now,
        CreatedAt = now
    };

    item.CurrentStock = newStock;
    item.UpdatedAt = now;

    _context.InventoryTransactions.Add(stockTransaction);

    await _context.SaveChangesAsync();
    await databaseTransaction.CommitAsync();

    return new InventoryTransactionDto
    {
      Id = stockTransaction.Id,
      InventoryItemId = stockTransaction.InventoryItemId,
      TransactionType = stockTransaction.TransactionType,
      Quantity = stockTransaction.Quantity,
      TransactionDate = stockTransaction.TransactionDate,
      Notes = stockTransaction.Notes,
      CreatedAt = stockTransaction.CreatedAt
    };

   }
  
}