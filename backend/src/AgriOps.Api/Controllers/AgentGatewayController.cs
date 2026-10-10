using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AgriOpsAI.Api.Controllers;

// Clients talk only to ASP.NET Core. Python remains an internal service and
// independently verifies the forwarded manager identity for checkpoint ownership.
[ApiController]
[Authorize(Policy = "Manager")]
[Route("api/inventory-agent")]
public sealed class AgentGatewayController(IHttpClientFactory clients, IConfiguration configuration) : ControllerBase
{
    [HttpPost("recommend")]
    [RequestSizeLimit(8192)]
    public Task<IActionResult> Recommend([FromBody] JsonElement body, CancellationToken cancellationToken)
        => Forward(HttpMethod.Post, "recommend", body.GetRawText(), cancellationToken);

    [HttpGet("runs/{id:guid}")]
    public Task<IActionResult> Run(Guid id, CancellationToken cancellationToken)
        => Forward(HttpMethod.Get, $"runs/{id}", null, cancellationToken);

    [HttpPost("runs/{id:guid}/resume")]
    public Task<IActionResult> Resume(Guid id, CancellationToken cancellationToken)
        => Forward(HttpMethod.Post, $"runs/{id}/resume", null, cancellationToken);

    private async Task<IActionResult> Forward(HttpMethod method, string path, string? body, CancellationToken cancellationToken)
    {
        var configured = configuration["InventoryAgent:BaseUrl"] ?? "http://127.0.0.1:8003/";
        if (!Uri.TryCreate(configured, UriKind.Absolute, out var origin) ||
            !(origin.Scheme == "https" || (origin.Scheme == "http" && (origin.IsLoopback || origin.Host == "inventory-agent"))) ||
            origin.UserInfo.Length != 0 || origin.Query.Length != 0 || origin.Fragment.Length != 0 || origin.AbsolutePath != "/")
            return StatusCode(503, new { message = "Internal agent address is not configured correctly." });

        using var request = new HttpRequestMessage(method, new Uri(origin, path));
        request.Headers.Authorization = AuthenticationHeaderValue.Parse(Request.Headers.Authorization.ToString());
        if (body is not null) request.Content = new StringContent(body, Encoding.UTF8, "application/json");
        try
        {
            using var response = await clients.CreateClient("InventoryAgentGateway").SendAsync(request, cancellationToken);
            if ((int)response.StatusCode >= 500 || (int)response.StatusCode is >= 300 and < 400)
                return StatusCode(502, new { message = "Agent unavailable. Check the same run ID before retrying." });
            if (response.Content.Headers.ContentType?.MediaType != "application/json")
                return StatusCode(502, new { message = "Invalid agent response. Check the same run ID before retrying." });
            var json = await response.Content.ReadAsStringAsync(cancellationToken);
            // Reject malformed JSON; never pass through an HTML error page.
            using var parsed = JsonDocument.Parse(json);
            return new ContentResult { Content = json, ContentType = "application/json", StatusCode = (int)response.StatusCode };
        }
        catch (OperationCanceledException) when (!cancellationToken.IsCancellationRequested)
        {
            return StatusCode(504, new { message = "Agent timed out. Check the same run ID before retrying." });
        }
        catch (Exception exception) when (exception is HttpRequestException or JsonException)
        {
            return StatusCode(502, new { message = "Agent connection failed. Check the same run ID before retrying." });
        }
    }
}
