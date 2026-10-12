using System.ComponentModel.DataAnnotations;
using System.Text.Json;
using AgriOpsAI.Api.Data;
using AgriOpsAI.Api.DTOs;
using AgriOpsAI.Api.Models;
using AgriOpsAI.Api.Services;
using AgriOps.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Npgsql;

// Explicit opt-in. Never writes to the configured application database.
if (args.Length != 2 || args[0] != "--local-secrets") {
    Console.WriteLine("Usage: dotnet run --project tests/InventoryDatabaseChecks -- --local-secrets <secrets.json path>");
    return 2;
}
string? testDatabase = null;
try {
    using var secrets = JsonDocument.Parse(await File.ReadAllTextAsync(args[1]));
    var root = secrets.RootElement;
    var connection = root.TryGetProperty("ConnectionStrings:DefaultConnection", out var flat)
        ? flat.GetString() : root.GetProperty("ConnectionStrings").GetProperty("DefaultConnection").GetString();
    var builder = new NpgsqlConnectionStringBuilder(connection);
    if (builder.Host is not ("localhost" or "127.0.0.1" or "::1"))
        throw new InvalidOperationException("Only a local PostgreSQL server is allowed.");
    builder.Database = "postgres";
    builder.IncludeErrorDetail = false;
    await using var admin = new NpgsqlConnection(builder.ConnectionString);
    await admin.OpenAsync();
    testDatabase = "agriops_inventory_checks_" + Guid.NewGuid().ToString("N");
    await using (var create = new NpgsqlCommand($"CREATE DATABASE \"{testDatabase}\"", admin))
        await create.ExecuteNonQueryAsync();
    Console.WriteLine($"Isolated test database: {testDatabase}");
    builder.Database = testDatabase;
    var options = new DbContextOptionsBuilder<ApplicationDbContext>().UseNpgsql(builder.ConnectionString).Options;
    await using var db = new AgriOpsDbContext(options);
    await db.Database.EnsureCreatedAsync();
    int passed = 0;
    void Check(bool ok, string description) {
        if (!ok) throw new InvalidOperationException("Check failed: " + description);
        passed++;
        Console.WriteLine("PASS: " + description);
    }
    var inventory = new InventoryService(db);
    var movements = new InventoryTransactionService(db);
    var item = await inventory.CreateAsync(new CreateInventoryItemDto {
        Name = "Permission verification seed", Category = "Seeds", UnitOfMeasurement = "kg",
        MinimumStockLevel = 10m, UnitCost = 2m
    });
    Check(item.CurrentStock == 0, "New item starts with zero stock");
    await movements.CreateAsync(item.Id, new CreateInventoryTransactionDto { TransactionType = "Receive", Quantity = 10m });
    Check((await inventory.GetByIdAsync(item.Id))!.CurrentStock == 10m, "Receive adds stock");
    await movements.CreateAsync(item.Id, new CreateInventoryTransactionDto { TransactionType = "Use", Quantity = 3m });
    Check((await inventory.GetByIdAsync(item.Id))!.CurrentStock == 7m, "Usage subtracts stock");
    Check((await movements.GetHistoryAsync(item.Id))!.Count == 2, "Both movements are persisted");
    var rejected = false;
    try { await movements.CreateAsync(item.Id, new CreateInventoryTransactionDto { TransactionType = "Use", Quantity = 8m }); }
    catch (InvalidOperationException) { rejected = true; }
    catch (ValidationException) { rejected = true; }
    Check(rejected, "Insufficient stock is rejected");
    db.ChangeTracker.Clear();
    Check((await inventory.GetByIdAsync(item.Id))!.CurrentStock == 7m &&
        (await movements.GetHistoryAsync(item.Id))!.Count == 2, "Rejected usage leaves stock and history unchanged");
    var supplier = new Supplier { Id = Guid.NewGuid(), Name = "Verification supplier" };
    db.Suppliers.Add(supplier);
    db.SupplierItems.Add(new SupplierItem { Id = Guid.NewGuid(), SupplierId = supplier.Id,
        InventoryItemId = item.Id, UnitPrice = 2m, LeadTimeDays = 3, IsAvailable = true });
    await db.SaveChangesAsync();
    var recommendations = new ReorderRecommendationService(db);
    var recommendation = await recommendations.CreateAsync(new CreateReorderRecommendationDto {
        AgentRunId = Guid.NewGuid(), InventoryItemId = item.Id, SupplierId = supplier.Id,
        Model = "deterministic-verification", RecommendedQuantity = 5m,
        Reason = "Stock 7 kg is below the 10 kg minimum; available supplier has a three-day lead time."
    }, "verification-agent", "verification");
    Check(recommendation is not null && recommendation.Status == "Pending", "Recommendation requires approval");
    await recommendations.DecideAsync(recommendation!.Id, true, new RecommendationDecisionDto { Note = "Verified" }, "verification-manager", "verification");
    Check(await db.PurchaseRequests.CountAsync() == 1, "Approval creates one purchase request");
    Check((await inventory.GetByIdAsync(item.Id))!.CurrentStock == 7m, "Approval does not increase stock");
    await recommendations.DecideAsync(recommendation.Id, true, new RecommendationDecisionDto { Note = "Verified" }, "verification-manager", "verification");
    Check(await db.PurchaseRequests.CountAsync() == 1, "Repeated approval does not duplicate the purchase request");
    Check((await inventory.GetByIdAsync(item.Id))!.CurrentStock == 7m &&
        (await movements.GetHistoryAsync(item.Id))!.Count == 2, "Approval retry leaves stock and movement history unchanged");
    var purchaseService = new PurchaseRequestService(db, movements);
    var purchaseId = await db.PurchaseRequests.Select(p => p.Id).SingleAsync();
    var received = await purchaseService.ReceiveAsync(purchaseId, "Test supplier receipt");
    Check(received!.Status == "Received", "Receipt closes the approved purchase request");
    Check((await inventory.GetByIdAsync(item.Id))!.CurrentStock == 12m, "Linked receipt adds approved quantity exactly once");
    var receiptHistory = await movements.GetHistoryAsync(item.Id);
    Check(receiptHistory!.Count == 3 && receiptHistory.Any(t => (t.Notes ?? "").Contains(purchaseId.ToString())), "Receipt movement contains purchase reference");
    Check(!await db.PurchaseRequests.AnyAsync(p => p.Id == purchaseId && (p.Status == "Pending" || p.Status == "Approved")), "Received purchase no longer counts as incoming stock");
    rejected = false;
    try { await purchaseService.ReceiveAsync(purchaseId, "Duplicate receipt"); }
    catch (InvalidOperationException) { rejected = true; }
    Check(rejected, "Repeated receipt is rejected");
    db.ChangeTracker.Clear();
    Check((await inventory.GetByIdAsync(item.Id))!.CurrentStock == 12m && (await movements.GetHistoryAsync(item.Id))!.Count == 3, "Duplicate receipt leaves stock and history unchanged");
    Check(await purchaseService.ReceiveAsync(Guid.NewGuid(), null) is null, "Missing purchase does not create a movement");
    var offerService = new SupplierItemService(db);
    var datedOffer = await offerService.SaveAsync(supplier.Id, item.Id, new SaveSupplierItemDto {
        UnitPrice = 2m, LeadTimeDays = 3, IsAvailable = true, ExpirationDate = new DateOnly(2027, 12, 31)
    }, false);
    Check(datedOffer!.ExpirationDate == new DateOnly(2027, 12, 31), "Offer save returns expiration date");
    db.ChangeTracker.Clear();
    Check((await offerService.GetAsync(supplier.Id, item.Id))!.ExpirationDate == new DateOnly(2027, 12, 31), "Expiration date persists in database");
    await offerService.SaveAsync(supplier.Id, item.Id, new SaveSupplierItemDto {
        UnitPrice = 2m, LeadTimeDays = 3, IsAvailable = true, ExpirationDate = null
    }, false);
    db.ChangeTracker.Clear();
    Check((await offerService.GetAsync(supplier.Id, item.Id))!.ExpirationDate is null, "Optional expiration date can be cleared");
    var batchLookup = new InventoryBatchService(db);
    var qrBeforeItem = await inventory.CreateAsync(new CreateInventoryItemDto { Name = "QR pending", Category = "Test", UnitOfMeasurement = "packet", MinimumStockLevel = 1, UnitCost = 1 });
    var qrPurchase = new PurchaseRequest { Id = Guid.NewGuid(), InventoryItemId = qrBeforeItem.Id, SupplierId = supplier.Id, RequestedQuantity = 4, Status = "Approved" };
    db.PurchaseRequests.Add(qrPurchase); await db.SaveChangesAsync();
    var pendingQr = JsonSerializer.Serialize(await batchLookup.GetAsync(qrPurchase.Id));
    Check(pendingQr.Contains("Awaiting receipt") && pendingQr.Contains("\"remainingQuantity\":0"), "Approved QR has zero stock until receipt");
    await purchaseService.ReceiveAsync(qrPurchase.Id, "Batch delivery", new DateOnly(2027, 12, 31), "TC-409", "Shelf A");
    db.ChangeTracker.Clear();
    var deliveredBatch = await db.InventoryBatches.SingleAsync(b => b.Id == qrPurchase.Id);
    Check(deliveredBatch.RemainingQuantity == 4 && deliveredBatch.PurchaseRequestId == qrPurchase.Id && deliveredBatch.BatchNumber == "TC-409" && deliveredBatch.ShelfLocation == "Shelf A", "Purchase QR becomes its own received batch with actual details");
    await movements.CreateAsync(qrBeforeItem.Id, new CreateInventoryTransactionDto { TransactionType = "Use", Quantity = 1, BatchId = qrPurchase.Id });
    db.ChangeTracker.Clear();
    Check((await db.InventoryBatches.SingleAsync(b => b.Id == qrPurchase.Id)).RemainingQuantity == 3 && (await inventory.GetByIdAsync(qrBeforeItem.Id))!.CurrentStock == 3, "Partial issue reduces batch and total equally");
    Check(JsonSerializer.Serialize(await batchLookup.GetAsync(qrPurchase.Id)).Contains("\"remainingQuantity\":3"), "Scanning same printed QR returns current remaining quantity");
    var nextYear = DateOnly.FromDateTime(DateTime.UtcNow).AddYears(1);
    var fifoKnownItem = await inventory.CreateAsync(new CreateInventoryItemDto { Name = "FIFO with different expiries", Category = "Test", UnitOfMeasurement = "packet", MinimumStockLevel = 1, UnitCost = 1 });
    await movements.CreateAsync(fifoKnownItem.Id, new CreateInventoryTransactionDto { TransactionType = "Receive", Quantity = 5, ExpirationDate = nextYear.AddDays(20), BatchNumber = "later-expiry" });
    await movements.CreateAsync(fifoKnownItem.Id, new CreateInventoryTransactionDto { TransactionType = "Receive", Quantity = 3, ExpirationDate = nextYear, BatchNumber = "earlier-expiry" });
    var firstBatch = await db.InventoryBatches.SingleAsync(b => b.InventoryItemId == fifoKnownItem.Id && b.BatchNumber == "earlier-expiry");
    var secondBatch = await db.InventoryBatches.SingleAsync(b => b.InventoryItemId == fifoKnownItem.Id && b.BatchNumber == "later-expiry");
    rejected = false;
    try { await movements.CreateAsync(fifoKnownItem.Id, new CreateInventoryTransactionDto { TransactionType = "Use", Quantity = 1, BatchId = firstBatch.Id }); }
    catch (InvalidOperationException) { rejected = true; }
    Check(rejected, "QR issue rejects a newer arrival while an older unexpired batch is available");
    db.ChangeTracker.Clear();
    Check((await inventory.GetByIdAsync(fifoKnownItem.Id))!.CurrentStock == 8 && (await db.InventoryBatches.SingleAsync(b => b.Id == secondBatch.Id)).RemainingQuantity == 5, "Rejected FIFO issue leaves all balances unchanged");
    await movements.CreateAsync(fifoKnownItem.Id, new CreateInventoryTransactionDto { TransactionType = "Use", Quantity = 4 });
    db.ChangeTracker.Clear();
    Check((await db.InventoryBatches.SingleAsync(b => b.Id == firstBatch.Id)).RemainingQuantity == 3 && (await db.InventoryBatches.SingleAsync(b => b.Id == secondBatch.Id)).RemainingQuantity == 1, "General usage consumes the older arrival first even when a newer batch expires sooner");
    Check(await db.InventoryBatchMovements.CountAsync(m => m.InventoryBatchId == secondBatch.Id) == 2, "Batch receipt and issue allocations retain an audit trail");
    await movements.CreateAsync(fifoKnownItem.Id, new CreateInventoryTransactionDto { TransactionType = "Receive", Quantity = 2, ExpirationDate = DateOnly.FromDateTime(DateTime.UtcNow).AddDays(-1), BatchNumber = "expired" });
    var expiredId = await db.InventoryBatches.Where(b => b.InventoryItemId == fifoKnownItem.Id && b.BatchNumber == "expired").Select(b => b.Id).SingleAsync();
    rejected = false;
    try { await movements.CreateAsync(fifoKnownItem.Id, new CreateInventoryTransactionDto { TransactionType = "Use", Quantity = 1, BatchId = expiredId }); }
    catch (InvalidOperationException) { rejected = true; }
    Check(rejected, "Expired batch cannot be issued by QR");
    db.ChangeTracker.Clear();
    rejected = false;
    try { await movements.CreateAsync(fifoKnownItem.Id, new CreateInventoryTransactionDto { TransactionType = "Use", Quantity = 5 }); }
    catch (InvalidOperationException) { rejected = true; }
    Check(rejected, "General usage cannot consume expired stock to cover a shortage");
    db.ChangeTracker.Clear();
    rejected = false;
    try { await movements.CreateAsync(fifoKnownItem.Id, new CreateInventoryTransactionDto { TransactionType = "Use", Quantity = 1, BatchId = qrPurchase.Id }); }
    catch (InvalidOperationException) { rejected = true; }
    Check(rejected, "QR from another item cannot issue this item's stock");
    db.ChangeTracker.Clear();
    var legacyItem = await inventory.CreateAsync(new CreateInventoryItemDto { Name = "Pre-upgrade stock", Category = "Test", UnitOfMeasurement = "kg", MinimumStockLevel = 0, UnitCost = 1 });
    var legacyEntity = await db.InventoryItems.SingleAsync(i => i.Id == legacyItem.Id); legacyEntity.CurrentStock = 10; await db.SaveChangesAsync();
    await movements.CreateAsync(legacyItem.Id, new CreateInventoryTransactionDto { TransactionType = "Use", Quantity = 2 });
    db.ChangeTracker.Clear();
    var legacyBatch = await db.InventoryBatches.SingleAsync(b => b.InventoryItemId == legacyItem.Id);
    Check(legacyBatch.IsLegacy && legacyBatch.RemainingQuantity == 8 && legacyBatch.ExpirationDate is null, "Existing stock is preserved without inventing an expiration date");
    rejected = false;
    try { await purchaseService.ReceiveAsync(qrPurchase.Id, "duplicate"); }
    catch (InvalidOperationException) { rejected = true; }
    db.ChangeTracker.Clear();
    Check(rejected && await db.InventoryBatches.CountAsync(b => b.PurchaseRequestId == qrPurchase.Id) == 1, "Duplicate purchase receipt cannot create another batch");
    Check(await batchLookup.UpdateAsync(qrPurchase.Id, nextYear, "TC-409 updated", "Shelf B"), "Manager can update batch metadata behind a permanent QR");
    db.ChangeTracker.Clear();
    Check((await db.InventoryBatches.SingleAsync(b => b.Id == qrPurchase.Id)).RemainingQuantity == 3 && (await inventory.GetByIdAsync(qrBeforeItem.Id))!.CurrentStock == 3, "Updating QR details does not change quantities");
    var concurrentItem = await inventory.CreateAsync(new CreateInventoryItemDto { Name = "Concurrent batch test", Category = "Test", UnitOfMeasurement = "packet", MinimumStockLevel = 0, UnitCost = 1 });
    await movements.CreateAsync(concurrentItem.Id, new CreateInventoryTransactionDto { TransactionType = "Receive", Quantity = 2, ExpirationDate = nextYear });
    var concurrentBatchId = await db.InventoryBatches.Where(b => b.InventoryItemId == concurrentItem.Id).Select(b => b.Id).SingleAsync();
    async Task<bool> TryIssue() {
        await using var separate = new AgriOpsDbContext(options);
        try { await new InventoryTransactionService(separate).CreateAsync(concurrentItem.Id, new CreateInventoryTransactionDto { TransactionType = "Use", Quantity = 1.5m, BatchId = concurrentBatchId }); return true; }
        catch (InvalidOperationException) { return false; }
    }
    var attempts = await Task.WhenAll(TryIssue(), TryIssue());
    Check(attempts.Count(a => a) == 1, "Concurrent QR issues cannot overspend the same batch");
    db.ChangeTracker.Clear();
    Check((await db.InventoryBatches.SingleAsync(b => b.Id == concurrentBatchId)).RemainingQuantity == 0.5m && (await inventory.GetByIdAsync(concurrentItem.Id))!.CurrentStock == 0.5m, "Concurrent issue preserves matching batch and item balances");
    var upgradeSql = await File.ReadAllTextAsync("backend/inventory_batches_upgrade.sql");
    await db.Database.ExecuteSqlRawAsync(upgradeSql);
    await db.Database.ExecuteSqlRawAsync(upgradeSql);
    Check((await inventory.GetByIdAsync(concurrentItem.Id))!.CurrentStock == 0.5m, "Additive deployment upgrade can run repeatedly without altering stock");
    var fifoItem = await inventory.CreateAsync(new CreateInventoryItemDto { Name = "Unknown date FIFO", Category = "Test", UnitOfMeasurement = "packet", MinimumStockLevel = 0, UnitCost = 1 });
    await movements.CreateAsync(fifoItem.Id, new CreateInventoryTransactionDto { TransactionType = "Receive", Quantity = 2, BatchNumber = "first-arrival" });
    await movements.CreateAsync(fifoItem.Id, new CreateInventoryTransactionDto { TransactionType = "Receive", Quantity = 2, BatchNumber = "second-arrival" });
    await movements.CreateAsync(fifoItem.Id, new CreateInventoryTransactionDto { TransactionType = "Use", Quantity = 1 });
    db.ChangeTracker.Clear();
    Check((await db.InventoryBatches.SingleAsync(b => b.InventoryItemId == fifoItem.Id && b.BatchNumber == "first-arrival")).RemainingQuantity == 1 &&
        (await db.InventoryBatches.SingleAsync(b => b.InventoryItemId == fifoItem.Id && b.BatchNumber == "second-arrival")).RemainingQuantity == 2, "Unknown expiry dates use FIFO arrival order");
    Console.WriteLine($"{passed} database checks passed. Database retained for inspection; application database untouched.");
    return 0;
} catch (Exception ex) {
    // Do not print configuration values or provider errors that could contain secrets.
    Console.Error.WriteLine($"Database checks failed: {ex.GetType().Name}.");
    if (ex is PostgresException pg) Console.Error.WriteLine($"PostgreSQL SQLSTATE: {pg.SqlState}");
    if (testDatabase is not null) Console.Error.WriteLine($"Test database retained: {testDatabase}");
    return 1;
}
