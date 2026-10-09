using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;

namespace AgriOpsAI.Api.Services;

public static class InventoryPermissions
{
    public static bool IsManager(ClaimsPrincipal user) =>
        user.Identity?.IsAuthenticated == true && (user.IsInRole("FarmManager") || user.IsInRole("Administrator") || user.IsInRole("Manager")) && !user.IsInRole("InventoryAgent");

    public static bool CanMove(ClaimsPrincipal user, string type) => type switch
    {
        "Receive" => IsManager(user),
        "Use" => IsManager(user) || (user.Identity?.IsAuthenticated == true &&
            (user.IsInRole("FarmWorker") || user.IsInRole("FieldWorker") || user.IsInRole("Farmer")) && !user.IsInRole("InventoryAgent")),
        _ => false
    };

    public static void Configure(AuthorizationOptions options)
    {
        options.AddPolicy("InventoryRead", p => p.RequireAuthenticatedUser()
            .RequireClaim("sub").RequireRole("FarmManager", "FarmWorker", "FieldWorker", "Farmer", "InventoryAgent", "Administrator", "Agronomist", "Manager"));
        options.AddPolicy("Manager", p => p.RequireAuthenticatedUser().RequireClaim("sub").RequireClaim("iss")
            .RequireAssertion(c => IsManager(c.User)));
        options.AddPolicy("InventoryAgent", p => p.RequireAuthenticatedUser().RequireClaim("sub").RequireClaim("iss")
            .RequireRole("InventoryAgent").RequireAssertion(c => !c.User.IsInRole("FarmManager")));
        options.AddPolicy("RecommendationReader", p => p.RequireAuthenticatedUser().RequireClaim("sub").RequireClaim("iss")
            .RequireRole("FarmManager", "Administrator", "Manager", "Agronomist", "InventoryAgent"));
    }
}
