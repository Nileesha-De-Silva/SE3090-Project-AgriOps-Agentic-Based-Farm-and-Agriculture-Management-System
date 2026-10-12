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



    public async Task<List<InventoryTransactionDto>?> GetHistoryAsync(
    Guid inventoryItemId)
          {
            var itemExists = await _context.InventoryItems
                .AnyAsync(item => item.Id == inventoryItemId);

            if (!itemExists)
            {
                return null;
            }

            return await _context.InventoryTransactions
                .AsNoTracking()
                .Where(transaction =>
                    transaction.InventoryItemId == inventoryItemId)
                .OrderByDescending(transaction => transaction.TransactionDate)
                .ThenByDescending(transaction => transaction.Id)
                .Select(transaction => new InventoryTransactionDto
                {
                    Id = transaction.Id,
                    InventoryItemId = transaction.InventoryItemId,
                    TransactionType = transaction.TransactionType,
                    Quantity = transaction.Quantity,
                    TransactionDate = transaction.TransactionDate,
                    Notes = transaction.Notes,
                    CreatedAt = transaction.CreatedAt
                })
                .ToListAsync();
            }


    public async Task<InventoryTransactionDto?> GetByIdAsync(
    Guid transactionId)
    {
    return await _context.InventoryTransactions
        .AsNoTracking()
        .Where(transaction => transaction.Id == transactionId)
        .Select(transaction => new InventoryTransactionDto
        {
            Id = transaction.Id,
            InventoryItemId = transaction.InventoryItemId,
            TransactionType = transaction.TransactionType,
            Quantity = transaction.Quantity,
            TransactionDate = transaction.TransactionDate,
            Notes = transaction.Notes,
            CreatedAt = transaction.CreatedAt
        })
        .SingleOrDefaultAsync();
    }
    public async Task<InventoryTransactionDto?> CreateAsync(
      Guid inventoryItemId,
      CreateInventoryTransactionDto dto, Guid? purchaseRequestId = null, Guid? supplierId = null)
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
          _context.Database.CurrentTransaction is null
              ? await _context.Database.BeginTransactionAsync() : null;

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

    if (dto.TransactionType == "Receive" && dto.BatchId is not null)
        throw new ValidationException("Receive a new batch rather than adding goods to an existing batch label.");
    if (dto.TransactionType == "Use" && (dto.ExpirationDate is not null || dto.BatchNumber is not null || dto.ShelfLocation is not null))
        throw new ValidationException("Batch details are recorded only when receiving goods.");
    // Every stock mutation holds the same item lock. Batch balances and total stock commit together.
    var batches = await _context.InventoryBatches.Where(b => b.InventoryItemId == inventoryItemId).AsTracking().ToListAsync();
    var tracked = batches.Sum(b => b.RemainingQuantity);
    if (tracked > item.CurrentStock) throw new InvalidOperationException("Batch balances do not match inventory. Contact a manager.");
    if (tracked < item.CurrentStock) {
        var legacy = new InventoryBatch {
            Id = Guid.NewGuid(), InventoryItemId = inventoryItemId, BatchNumber = "Existing stock — date unknown",
            ReceivedQuantity = item.CurrentStock - tracked, RemainingQuantity = item.CurrentStock - tracked,
            ReceivedAt = item.CreatedAt, UpdatedAt = DateTime.UtcNow, IsLegacy = true
        };
        _context.InventoryBatches.Add(legacy); batches.Add(legacy);
    }
    var allocations = new List<(InventoryBatch Batch, decimal Quantity)>();
    var today = DateOnly.FromDateTime(DateTime.UtcNow);
    if (dto.TransactionType == "Use") {
        var eligible = batches.Where(b => b.RemainingQuantity > 0 && (b.ExpirationDate is null || b.ExpirationDate >= today))
            .OrderBy(b => b.ReceivedAt).ThenBy(b => b.Id).ToList();
        if (dto.BatchId is Guid batchId) {
            var selected = batches.SingleOrDefault(b => b.Id == batchId);
            if (selected is null) throw new InvalidOperationException("Batch not found for this inventory item.");
            if (selected.ExpirationDate < today) throw new InvalidOperationException("This batch has expired and cannot be issued.");
            if (quantity > selected.RemainingQuantity) throw new InvalidOperationException("Insufficient stock in this batch. Refresh its current quantity.");
            if (eligible.FirstOrDefault()?.Id != batchId) throw new InvalidOperationException("Issue the oldest received available batch first (FIFO). Refresh to see its label.");
            allocations.Add((selected, quantity));
        } else {
            if (eligible.Sum(b => b.RemainingQuantity) < quantity)
                throw new InvalidOperationException("Insufficient unexpired stock for this usage.");
            var left = quantity;
            foreach (var batch in eligible) {
                var take = Math.Min(left, batch.RemainingQuantity);
                allocations.Add((batch, take)); left -= take;
                if (left == 0) break;
            }
        }
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
    if (dto.TransactionType == "Receive") {
        var batch = new InventoryBatch {
            Id = purchaseRequestId ?? Guid.NewGuid(), InventoryItemId = inventoryItemId,
            PurchaseRequestId = purchaseRequestId, SupplierId = supplierId,
            BatchNumber = string.IsNullOrWhiteSpace(dto.BatchNumber) ? null : dto.BatchNumber.Trim(),
            ShelfLocation = string.IsNullOrWhiteSpace(dto.ShelfLocation) ? null : dto.ShelfLocation.Trim(),
            ExpirationDate = dto.ExpirationDate, ReceivedQuantity = quantity, RemainingQuantity = quantity,
            ReceivedAt = now, UpdatedAt = now
        };
        _context.InventoryBatches.Add(batch); allocations.Add((batch, quantity));
    }
    foreach (var allocation in allocations) {
        if (dto.TransactionType == "Use") allocation.Batch.RemainingQuantity -= allocation.Quantity;
        allocation.Batch.UpdatedAt = now;
        _context.InventoryBatchMovements.Add(new InventoryBatchMovement {
            Id = Guid.NewGuid(), InventoryBatchId = allocation.Batch.Id,
            InventoryTransactionId = stockTransaction.Id, Quantity = allocation.Quantity
        });
    }

    await _context.SaveChangesAsync();
    if (databaseTransaction is not null) await databaseTransaction.CommitAsync();

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