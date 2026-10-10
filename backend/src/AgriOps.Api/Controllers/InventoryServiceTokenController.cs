using AgriOpsAI.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
namespace AgriOpsAI.Api.Controllers;
[ApiController]
[Route("api/inventory-agent/service-token")]
public sealed class InventoryServiceTokenController(InventoryServiceIdentity identity) : ControllerBase
{
    public sealed record Credentials(string ClientId, string ClientSecret);
    [AllowAnonymous]
    [HttpPost]
    public async Task<IActionResult> Token(Credentials credentials, CancellationToken ct)
    {
        if (string.IsNullOrEmpty(credentials.ClientId) || credentials.ClientId.Length > 50 ||
            string.IsNullOrEmpty(credentials.ClientSecret) || credentials.ClientSecret.Length > 256) return Unauthorized();
        try
        {
            var token = await identity.IssueAsync(credentials.ClientId, credentials.ClientSecret, ct);
            return token is null ? Unauthorized() : Ok(token);
        }
        catch (InvalidOperationException) { return StatusCode(503, new { message = "Inventory service authentication is not configured correctly." }); }
    }
}
