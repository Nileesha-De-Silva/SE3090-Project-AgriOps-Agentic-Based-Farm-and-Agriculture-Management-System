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
    Console.WriteLine($"{passed} database checks passed. Database retained for inspection; application database untouched.");
    return 0;
} catch (Exception ex) {
    // Do not print configuration values or provider errors that could contain secrets.
    Console.Error.WriteLine($"Database checks failed: {ex.GetType().Name}.");
    if (ex is PostgresException pg) Console.Error.WriteLine($"PostgreSQL SQLSTATE: {pg.SqlState}");
    if (testDatabase is not null) Console.Error.WriteLine($"Test database retained: {testDatabase}");
    return 1;
}
