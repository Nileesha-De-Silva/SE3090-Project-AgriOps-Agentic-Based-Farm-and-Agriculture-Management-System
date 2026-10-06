using System.Security.Claims;
using System.Reflection;
using AgriOpsAI.Api.Services;
using AgriOpsAI.Api.Controllers;
using AgriOpsAI.Api.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.DependencyInjection;

// No app startup and no database connection. Exercise the production policies and denied actions.
var services = new ServiceCollection();
services.AddLogging();
services.AddAuthorization(InventoryPermissions.Configure);
using var provider = services.BuildServiceProvider();
var authorization = provider.GetRequiredService<IAuthorizationService>();
int passed = 0;
void Check(bool result, string description) {
    if (!result) throw new Exception(description);
    passed++;
}
ClaimsPrincipal User(params string[] roles) => new(new ClaimsIdentity(
    new[] { new Claim("sub", "test-user"), new Claim("iss", "permission-tests") }
        .Concat(roles.Select(r => new Claim(ClaimTypes.Role, r))), "test"));
foreach (var role in new[] { "FarmManager", "FarmWorker", "Farmer", "InventoryAgent", "Administrator", "Unknown" }) {
    var user = User(role);
    Check((await authorization.AuthorizeAsync(user, null, "InventoryRead")).Succeeded ==
        new[] { "FarmManager", "FarmWorker", "Farmer", "InventoryAgent" }.Contains(role), $"Read: {role}");
    Check((await authorization.AuthorizeAsync(user, null, "Manager")).Succeeded == (role == "FarmManager"), $"Approval: {role}");
    Check((await authorization.AuthorizeAsync(user, null, "InventoryAgent")).Succeeded == (role == "InventoryAgent"), $"Agent: {role}");
    foreach (var type in new[] { "Receive", "Use", "Invalid" }) {
        var expected = type == "Receive" ? role == "FarmManager" : type == "Use" && (role == "FarmManager" || role == "FarmWorker");
        Check(InventoryPermissions.CanMove(user, type) == expected, $"{role}: {type}");
        if (!expected) {
            var controller = new InventoryTransactionController(null!) {
                ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext { User = user } }
            };
            var result = await controller.Create(Guid.NewGuid(), new CreateInventoryTransactionDto { TransactionType = type, Quantity = 1 });
            Check(result.Result is ForbidResult, $"Denied before touching stock: {role}/{type}");
        }
    }
}
var anonymous = new ClaimsPrincipal(new ClaimsIdentity());
foreach (var policy in new[] { "InventoryRead", "Manager", "InventoryAgent", "RecommendationReader" })
    Check(!(await authorization.AuthorizeAsync(anonymous, null, policy)).Succeeded, $"Anonymous: {policy}");
Check(!InventoryPermissions.CanMove(User("FarmManager", "InventoryAgent"), "Receive"), "Mixed service role cannot receive");
foreach (var type in new[] { typeof(InventoryController), typeof(SupplierController), typeof(SupplierItemController), typeof(InventoryTransactionController) })
    Check(type.GetCustomAttributes<AuthorizeAttribute>().Any(a => a.Policy == "InventoryRead"), $"Protected controller: {type.Name}");
foreach (var name in new[] { "Approve", "Reject" })
    Check(typeof(ReorderRecommendationController).GetMethod(name)!.GetCustomAttributes<AuthorizeAttribute>().Any(a => a.Policy == "Manager"), $"Protected decision: {name}");
Check(typeof(PurchaseRequestController).GetCustomAttributes<AuthorizeAttribute>().Any(a => a.Policy == "Manager"), "Purchase requests require manager");
Check(!typeof(AuthController).GetCustomAttributes<AllowAnonymousAttribute>().Any(), "No anonymous override on registration");
Check(typeof(AuthController).GetMethod("Register")!.GetCustomAttributes<AuthorizeAttribute>().Any(a => a.Roles == "Administrator"), "Registration cannot self-assign manager access");
Console.WriteLine($"PASS: {passed} inventory permission checks. No database modified.");
