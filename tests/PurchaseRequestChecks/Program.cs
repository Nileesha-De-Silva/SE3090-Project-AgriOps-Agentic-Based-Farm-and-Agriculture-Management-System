using System.Net;
using System.Net.Http.Json;
using System.Net.Http.Headers;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text.Json;
using AgriOpsAI.Api.Controllers;
using AgriOpsAI.Api.Data;
using AgriOpsAI.Api.DTOs;
using AgriOpsAI.Api.Models;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.IdentityModel.Tokens;

var apiPath = Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "../../../../../backend/AgriOpsAI.Api"));
var configuration = new ConfigurationBuilder().SetBasePath(apiPath)
    .AddJsonFile("appsettings.json").AddJsonFile("appsettings.Development.json", optional: true)
    .AddUserSecrets(typeof(AgriOpsDbContext).Assembly, optional: true).AddEnvironmentVariables().Build();
var connection = configuration.GetConnectionString("DefaultConnection");
var options = new DbContextOptionsBuilder<AgriOpsDbContext>().UseNpgsql(connection).Options;
await using var db = new AgriOpsDbContext(options);
var itemId = Guid.NewGuid();
var supplierId = Guid.NewGuid();
var key = new SymmetricSecurityKey(RandomNumberGenerator.GetBytes(64));
int passed = 0;
void Check(bool condition, string message) { if (!condition) throw new Exception(message); }
void Pass(string description) { passed++; Console.WriteLine($"PASS {passed}: {description}"); }
WebApplicationFactory<ReorderRecommendationController> Factory(bool failSave = false)
    => new WebApplicationFactory<ReorderRecommendationController>().WithWebHostBuilder(host =>
    {
        host.UseEnvironment("Development").UseContentRoot(apiPath);
        host.ConfigureAppConfiguration((_, config) => config.AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["Authentication:ManagerRole"] = "Manager", ["Authentication:AgentRole"] = "InventoryAgent"
        }));
        host.ConfigureLogging(logging => logging.ClearProviders());
        host.ConfigureServices(services =>
        {
            services.PostConfigure<JwtBearerOptions>(JwtBearerDefaults.AuthenticationScheme, jwt =>
            {
                jwt.Authority = null; jwt.ConfigurationManager = null;
                jwt.TokenValidationParameters.ValidIssuer = "recommendation-checks";
                jwt.TokenValidationParameters.ValidAudience = "recommendation-api-checks";
                jwt.TokenValidationParameters.IssuerSigningKey = key;
                jwt.TokenValidationParameters.RoleClaimType = "role";
            });
            if (failSave) services.AddDbContext<AgriOpsDbContext>(o => o.UseNpgsql(connection).AddInterceptors(new FailPurchaseSave()));
        });
    });
string Token(string role, bool expired = false, string issuer = "recommendation-checks",
    string audience = "recommendation-api-checks", SecurityKey? signingKey = null)
    => new JwtSecurityTokenHandler().WriteToken(new JwtSecurityToken(issuer, audience,
        new[] { new Claim("sub", role == "InventoryAgent" ? "test-agent" : "test-manager"), new Claim("role", role) },
        DateTime.UtcNow.AddMinutes(-10), DateTime.UtcNow.AddMinutes(expired ? -5 : 5),
        new SigningCredentials(signingKey ?? key, SecurityAlgorithms.HmacSha256)));
using var factory = Factory();
using var client = factory.CreateClient(new WebApplicationFactoryClientOptions { BaseAddress = new Uri("https://localhost"), AllowAutoRedirect = false });
var agent = Token("InventoryAgent");
var manager = Token("Manager");
const string route = "/api/reorder-recommendations";
CreateReorderRecommendationDto Input() => new()
{
    AgentRunId = Guid.NewGuid(), Model = "synthetic-test-fixture-not-an-LLM", InventoryItemId = itemId,
    SupplierId = supplierId, RecommendedQuantity = 5, Reason = " Test low-stock recommendation "
};
async Task<HttpResponseMessage> Call(HttpMethod method, string path, object? body, HttpStatusCode expected,
    string? token = null, HttpClient? http = null)
{
    using var message = new HttpRequestMessage(method, path);
    if (body is not null) message.Content = JsonContent.Create(body);
    if (token is not null) message.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
    var response = await (http ?? client).SendAsync(message);
    Check(response.StatusCode == expected, $"{path}: expected {expected}, got {response.StatusCode}: {await response.Content.ReadAsStringAsync()}");
    return response;
}
async Task<ReorderRecommendationDto> Propose(CreateReorderRecommendationDto? input = null)
{
    var response = await Call(HttpMethod.Post, route, input ?? Input(), HttpStatusCode.Created, agent);
    Check(response.Headers.Location is not null, "Creation Location header missing");
    return (await response.Content.ReadFromJsonAsync<ReorderRecommendationDto>())!;
}
async Task<ReorderRecommendationDto> Decide(Guid id, bool approve, HttpStatusCode expected = HttpStatusCode.OK,
    string? token = null, HttpClient? http = null)
{
    var response = await Call(HttpMethod.Post, $"{route}/{id}/{(approve ? "approve" : "reject")}",
        new { note = " Manager test decision " }, expected, token ?? manager, http);
    return expected == HttpStatusCode.OK ? (await response.Content.ReadFromJsonAsync<ReorderRecommendationDto>())! : null!;
}
Task<int> PurchaseCount() => db.PurchaseRequests.CountAsync(r => r.InventoryItemId == itemId);
try
{
    Check(!(await db.Database.GetPendingMigrationsAsync()).Any(), "Apply the recommendation migration before running checks.");
    db.InventoryItems.Add(new InventoryItem { Id = itemId, Name = "Recommendation verification", Category = "Test",
        UnitOfMeasurement = "kg", MinimumStockLevel = 10, CurrentStock = 0 });
    db.Suppliers.Add(new Supplier { Id = supplierId, Name = "Recommendation verification" });
    await db.SaveChangesAsync();
    await Call(HttpMethod.Post, route, Input(), HttpStatusCode.Unauthorized);
    await Call(HttpMethod.Post, route, Input(), HttpStatusCode.Forbidden, Token("Worker"));
    await Call(HttpMethod.Post, route, Input(), HttpStatusCode.Forbidden, manager);
    await Call(HttpMethod.Post, route, new { }, HttpStatusCode.BadRequest, agent);
    foreach (var quantity in new[] { 0m, -1m, 1.234m, 100000000m })
    {
        var bad = Input(); bad.RecommendedQuantity = quantity;
        await Call(HttpMethod.Post, route, bad, HttpStatusCode.BadRequest, agent);
    }
    var blank = Input(); blank.Reason = " ";
    await Call(HttpMethod.Post, route, blank, HttpStatusCode.BadRequest, agent);
    var empty = Input(); empty.AgentRunId = Guid.Empty;
    await Call(HttpMethod.Post, route, empty, HttpStatusCode.BadRequest, agent);
    var missing = Input(); missing.SupplierId = Guid.NewGuid();
    await Call(HttpMethod.Post, route, missing, HttpStatusCode.NotFound, agent);
    await Call(HttpMethod.Post, route, Input(), HttpStatusCode.Conflict, agent);
    db.SupplierItems.Add(new SupplierItem { Id = Guid.NewGuid(), SupplierId = supplierId, InventoryItemId = itemId,
        UnitPrice = 12.50m, LeadTimeDays = 3, IsAvailable = false });
    await db.SaveChangesAsync();
    await Call(HttpMethod.Post, route, Input(), HttpStatusCode.Conflict, agent);
    await db.SupplierItems.Where(l => l.InventoryItemId == itemId).ExecuteUpdateAsync(u => u.SetProperty(l => l.IsAvailable, true));
    Check(!await db.ReorderRecommendations.AnyAsync(r => r.InventoryItemId == itemId), "Rejected proposal persisted");
    Pass("Proposal authorization, validation, missing/unavailable/unlinked supplier rejection");

    await Call(HttpMethod.Get, "/api/inventory-agent/access", null, HttpStatusCode.Unauthorized);
    await Call(HttpMethod.Get, "/api/inventory-agent/access", null, HttpStatusCode.Forbidden, agent);
    var identity = await (await Call(HttpMethod.Get, "/api/inventory-agent/access", null, HttpStatusCode.OK, manager))
        .Content.ReadFromJsonAsync<JsonElement>();
    Check(identity.GetProperty("subject").GetString() == "test-manager", "Caller identity mismatch");
    await Call(HttpMethod.Get, $"/api/inventory-agent/items/{itemId}/context", null, HttpStatusCode.Unauthorized);
    var evidence = await (await Call(HttpMethod.Get, $"/api/inventory-agent/items/{itemId}/context", null, HttpStatusCode.OK, agent))
        .Content.ReadFromJsonAsync<JsonElement>();
    Check(evidence.GetProperty("item").GetProperty("id").GetGuid() == itemId &&
        evidence.GetProperty("offers").GetArrayLength() == 1 && evidence.GetProperty("incomingQuantity").GetDecimal() == 0,
        "Agent context evidence mismatch");
    object ObservedPayload(string stock) => new
    {
        agentRunId = Guid.NewGuid(), model = "python-contract-test", inventoryItemId = itemId, supplierId,
        recommendedQuantity = "5", reason = "Verify Python decimal string contract",
        observation = new { currentStock = stock, minimumStockLevel = "10", unitPrice = "12.50",
            leadTimeDays = 3, incomingQuantity = "0", unitOfMeasurement = "kg" }
    };
    await Call(HttpMethod.Post, route, ObservedPayload("99"), HttpStatusCode.Conflict, agent);
    var observed = await (await Call(HttpMethod.Post, route, ObservedPayload("0"), HttpStatusCode.Created, agent))
        .Content.ReadFromJsonAsync<ReorderRecommendationDto>();
    await Decide(observed!.Id, false);
    Pass("Manager access verification, authenticated agent context, Python decimal contract and stale evidence rejection");

    var input = Input();
    var proposed = await Propose(input);
    Check(proposed.Status == "Pending" && proposed.PurchaseRequestId is null && await PurchaseCount() == 0,
        "Purchase request created before human approval");
    Check(proposed.EstimatedCost == 62.50m && proposed.UnitPrice == 12.50m && proposed.StockAtProposal == 0 &&
        proposed.Reason == "Test low-stock recommendation", "Review snapshot incorrect");
    var replay = await Propose(input);
    Check(replay.Id == proposed.Id, "Submission retry duplicated recommendation");
    input.RecommendedQuantity = 6;
    await Call(HttpMethod.Post, route, input, HttpStatusCode.Conflict, agent);
    await Call(HttpMethod.Post, route, Input(), HttpStatusCode.Conflict, agent);
    using (var restartFactory = Factory())
    using (var restarted = restartFactory.CreateClient(new WebApplicationFactoryClientOptions { BaseAddress = new Uri("https://localhost") }))
        await Call(HttpMethod.Get, $"{route}/{proposed.Id}", null, HttpStatusCode.OK, manager, restarted);
    var list = await (await Call(HttpMethod.Get, route, null, HttpStatusCode.OK, manager)).Content.ReadFromJsonAsync<List<ReorderRecommendationDto>>();
    Check(list!.Any(r => r.Id == proposed.Id), "Manager review list omitted proposal");
    Pass("Durable Pending review, server snapshot, submission idempotency, one pending proposal per item");

    // With no purchase request or catalogue link, recommendation history alone must protect parents and units.
    await db.SupplierItems.Where(l => l.InventoryItemId == itemId).ExecuteDeleteAsync();
    await Call(HttpMethod.Delete, $"/api/suppliers/{supplierId}", null, HttpStatusCode.Conflict);
    await Call(HttpMethod.Delete, $"/api/inventory/{itemId}", null, HttpStatusCode.Conflict);
    await Call(HttpMethod.Put, $"/api/inventory/{itemId}", new
    {
        name = "Recommendation verification", category = "Test", unitOfMeasurement = "litres",
        minimumStockLevel = 10, unitCost = 0
    }, HttpStatusCode.Conflict);
    db.ChangeTracker.Clear();
    db.SupplierItems.Add(new SupplierItem { Id = Guid.NewGuid(), InventoryItemId = itemId, SupplierId = supplierId,
        UnitPrice = 12.50m, LeadTimeDays = 3, IsAvailable = true });
    await db.SaveChangesAsync();
    Pass("Recommendation history alone protects supplier, inventory item and unit of measurement");

    await Call(HttpMethod.Post, $"{route}/{proposed.Id}/approve", new { }, HttpStatusCode.Unauthorized);
    await Decide(proposed.Id, true, HttpStatusCode.Forbidden, agent);
    await Decide(proposed.Id, true, HttpStatusCode.Forbidden, Token("Worker"));
    foreach (var badToken in new[] { Token("Manager", expired: true), Token("Manager", issuer: "wrong"),
        Token("Manager", audience: "wrong"), Token("Manager", signingKey: new SymmetricSecurityKey(RandomNumberGenerator.GetBytes(64))) })
        await Decide(proposed.Id, true, HttpStatusCode.Unauthorized, badToken);
    Check(await PurchaseCount() == 0, "Unauthorized call created a purchase request");
    Pass("Only a valid human-manager JWT can approve; agent cannot self-approve");

    var approved = await Decide(proposed.Id, true);
    var again = await Decide(proposed.Id, true);
    Check(approved.Status == "Approved" && approved.PurchaseRequestId is not null && approved.PurchaseRequestId == again.PurchaseRequestId &&
        approved.DecidedBy == "test-manager" && approved.DecidedByIssuer == "recommendation-checks" &&
        approved.DecidedAt is not null && approved.DecisionNote == "Manager test decision" && await PurchaseCount() == 1, "Approval/audit/idempotency failed");
    var purchase = await db.PurchaseRequests.AsNoTracking().SingleAsync(r => r.Id == approved.PurchaseRequestId);
    Check(purchase.RequestedQuantity == 5 && purchase.SupplierId == supplierId && purchase.Status == "Approved" && purchase.ApprovedAt is not null,
        "Purchase request differs from approved recommendation");
    var incomingEvidence = await (await Call(HttpMethod.Get, $"/api/inventory-agent/items/{itemId}/context", null, HttpStatusCode.OK, agent))
        .Content.ReadFromJsonAsync<JsonElement>();
    Check(incomingEvidence.GetProperty("incomingQuantity").GetDecimal() == 5, "Agent context omitted approved incoming purchase");
    await Call(HttpMethod.Get, $"/api/purchase-requests/{purchase.Id}", null, HttpStatusCode.OK, manager);
    await Decide(proposed.Id, false, HttpStatusCode.Conflict);
    Pass("Approval creates exactly one matching purchase request and records manager audit");

    var reject = await Propose();
    var rejected = await Decide(reject.Id, false);
    await Decide(reject.Id, false);
    Check(rejected.Status == "Rejected" && rejected.PurchaseRequestId is null && await PurchaseCount() == 1, "Rejection created purchase request");
    await Decide(reject.Id, true, HttpStatusCode.Conflict);
    Pass("Rejection never creates a purchase request; opposite decision is blocked");

    var stale = await Propose();
    await db.SupplierItems.Where(l => l.InventoryItemId == itemId).ExecuteUpdateAsync(u => u.SetProperty(l => l.UnitPrice, 13m));
    await Decide(stale.Id, true, HttpStatusCode.Conflict);
    Check(await PurchaseCount() == 1, "Stale price approval created request");
    await Decide(stale.Id, false);
    var stockChanged = await Propose();
    await db.InventoryItems.Where(i => i.Id == itemId).ExecuteUpdateAsync(u => u.SetProperty(i => i.CurrentStock, 1m));
    await Decide(stockChanged.Id, true, HttpStatusCode.Conflict);
    await Decide(stockChanged.Id, false);
    await db.InventoryItems.Where(i => i.Id == itemId).ExecuteUpdateAsync(u => u.SetProperty(i => i.CurrentStock, 0m));
    Pass("Changed supplier price or stock requires a fresh proposal");

    var parallel = await Propose();
    var decisions = await Task.WhenAll(Decide(parallel.Id, true), Decide(parallel.Id, true));
    Check(decisions[0].PurchaseRequestId == decisions[1].PurchaseRequestId && await PurchaseCount() == 2, "Concurrent approval duplicated purchase");
    var contested = await Propose();
    using var approveMessage = new HttpRequestMessage(HttpMethod.Post, $"{route}/{contested.Id}/approve") { Content = JsonContent.Create(new { }) };
    using var rejectMessage = new HttpRequestMessage(HttpMethod.Post, $"{route}/{contested.Id}/reject") { Content = JsonContent.Create(new { }) };
    approveMessage.Headers.Authorization = rejectMessage.Headers.Authorization = new AuthenticationHeaderValue("Bearer", manager);
    var competing = await Task.WhenAll(client.SendAsync(approveMessage), client.SendAsync(rejectMessage));
    Check(competing.Count(r => r.StatusCode == HttpStatusCode.OK) == 1 && competing.Count(r => r.StatusCode == HttpStatusCode.Conflict) == 1,
        "Conflicting concurrent decisions both succeeded");
    Pass("Concurrent retries create one request; conflicting decisions have one winner");

    var failed = await Propose();
    var beforeFailure = await PurchaseCount();
    using (var failingFactory = Factory(failSave: true))
    using (var failing = failingFactory.CreateClient(new WebApplicationFactoryClientOptions { BaseAddress = new Uri("https://localhost") }))
        await Decide(failed.Id, true, HttpStatusCode.InternalServerError, http: failing);
    Check(await PurchaseCount() == beforeFailure &&
        await db.ReorderRecommendations.Where(r => r.Id == failed.Id).Select(r => r.Status).SingleAsync() == "Pending", "Failed save committed partial approval");
    await Decide(failed.Id, false);
    Pass("Injected purchase-write failure rolls back approval and creates no purchase request");

    await Call(HttpMethod.Post, "/api/purchase-requests", new { }, HttpStatusCode.MethodNotAllowed, agent);
    await Call(HttpMethod.Post, $"/api/purchase-requests/{purchase.Id}/approve", new { }, HttpStatusCode.NotFound, manager);
    await Decide(Guid.NewGuid(), true, HttpStatusCode.NotFound);
    Check(await db.InventoryItems.Where(i => i.Id == itemId).Select(i => i.CurrentStock).SingleAsync() == 0 &&
        !await db.InventoryTransactions.AnyAsync(t => t.InventoryItemId == itemId), "Workflow changed stock");
    Pass("Old bypass routes removed, missing decision returns 404, stock/history unchanged");
    Console.WriteLine($"RESULT: {passed}/11 groups passed. No LLM was called; proposals are labelled synthetic fixtures.");
}
finally
{
    db.ChangeTracker.Clear();
    await db.ReorderRecommendations.Where(r => r.InventoryItemId == itemId).ExecuteDeleteAsync();
    await db.PurchaseRequests.Where(r => r.InventoryItemId == itemId).ExecuteDeleteAsync();
    await db.SupplierItems.Where(l => l.InventoryItemId == itemId).ExecuteDeleteAsync();
    await db.Suppliers.Where(s => s.Id == supplierId).ExecuteDeleteAsync();
    await db.InventoryItems.Where(i => i.Id == itemId).ExecuteDeleteAsync();
    Console.WriteLine("Temporary records removed using this run's generated IDs.");
}

public class FailPurchaseSave : SaveChangesInterceptor
{
    public override ValueTask<int> SavedChangesAsync(SaveChangesCompletedEventData eventData,
        int result, CancellationToken cancellationToken = default)
    {
        // Fail after the SQL writes, but before the service commits its outer transaction.
        if (eventData.Context!.ChangeTracker.Entries<PurchaseRequest>().Any())
            throw new DbUpdateException("Injected test-only failure after purchase SQL and before commit.");
        return ValueTask.FromResult(result);
    }
}
