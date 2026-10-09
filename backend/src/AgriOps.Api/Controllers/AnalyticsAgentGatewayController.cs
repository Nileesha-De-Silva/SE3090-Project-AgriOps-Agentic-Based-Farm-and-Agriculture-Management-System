using System;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;

namespace AgriOpsAI.Api.Controllers;

/// <summary>
/// Gateway controller for Agent 4: Production Analytics & Operations Sentinel Agent.
/// Enforces the Mandatory Backend Rule: Frontend communicates solely with ASP.NET Core.
/// </summary>
[ApiController]
[Authorize(Roles = "Administrator,FarmManager")]
[Route("api/analytics-agent")]
public sealed class AnalyticsAgentGatewayController : ControllerBase
{
    private readonly IHttpClientFactory _clientFactory;
    private readonly IConfiguration _configuration;

    public AnalyticsAgentGatewayController(IHttpClientFactory clientFactory, IConfiguration configuration)
    {
        _clientFactory = clientFactory;
        _configuration = configuration;
    }

    [HttpPost("analyze")]
    [RequestSizeLimit(16384)]
    public Task<IActionResult> Analyze([FromBody] JsonElement body, CancellationToken cancellationToken)
        => Forward(HttpMethod.Post, "sentinel/analyze", body.GetRawText(), cancellationToken);

    [HttpGet("runs/{id:guid}")]
    public Task<IActionResult> GetRun(Guid id, CancellationToken cancellationToken)
        => Forward(HttpMethod.Get, $"runs/{id}", null, cancellationToken);

    [HttpPost("runs/{id:guid}/approve")]
    public Task<IActionResult> Approve(Guid id, [FromBody] JsonElement body, CancellationToken cancellationToken)
        => Forward(HttpMethod.Post, $"runs/{id}/approve", body.GetRawText(), cancellationToken);

    [HttpPost("runs/{id:guid}/reject")]
    public Task<IActionResult> Reject(Guid id, [FromBody] JsonElement body, CancellationToken cancellationToken)
        => Forward(HttpMethod.Post, $"runs/{id}/reject", body.GetRawText(), cancellationToken);

    private async Task<IActionResult> Forward(HttpMethod method, string path, string? body, CancellationToken cancellationToken)
    {
        var configured = _configuration["AnalyticsAgent:BaseUrl"] ?? "http://localhost:8004/";
        if (!Uri.TryCreate(configured, UriKind.Absolute, out var origin))
        {
            return StatusCode(503, new { message = "Analytics Agent address is not configured correctly." });
        }

        using var request = new HttpRequestMessage(method, new Uri(origin, path));
        if (Request.Headers.ContainsKey("Authorization"))
        {
            request.Headers.Authorization = AuthenticationHeaderValue.Parse(Request.Headers.Authorization.ToString());
        }

        if (body is not null)
        {
            request.Content = new StringContent(body, Encoding.UTF8, "application/json");
        }

        try
        {
            var client = _clientFactory.CreateClient("AnalyticsAgentGateway");
            using var response = await client.SendAsync(request, cancellationToken);

            if ((int)response.StatusCode >= 500 || (int)response.StatusCode is >= 300 and < 400)
            {
                return StatusCode(502, new { message = "Analytics Sentinel Agent unavailable." });
            }

            var json = await response.Content.ReadAsStringAsync(cancellationToken);
            return new ContentResult
            {
                Content = json,
                ContentType = "application/json",
                StatusCode = (int)response.StatusCode
            };
        }
        catch (OperationCanceledException) when (!cancellationToken.IsCancellationRequested)
        {
            return StatusCode(504, new { message = "Analytics Sentinel Agent timed out." });
        }
        catch (Exception ex) when (ex is HttpRequestException or JsonException)
        {
            return StatusCode(502, new { message = "Analytics Sentinel Agent connection failed.", error = ex.Message });
        }
    }
}
