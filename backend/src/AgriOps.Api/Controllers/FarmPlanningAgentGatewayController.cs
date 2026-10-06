using System;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;

namespace AgriOps.Api.Controllers;

/// <summary>
/// Gateway controller for Agent 1: Farm Planning Agent.
/// Enforces the Mandatory Backend Rule: Clients communicate exclusively through ASP.NET Core.
/// </summary>
[ApiController]
[Route("api/farm-planning-agent")]
public sealed class FarmPlanningAgentGatewayController : ControllerBase
{
    private readonly IHttpClientFactory _clientFactory;
    private readonly IConfiguration _configuration;

    public FarmPlanningAgentGatewayController(IHttpClientFactory clientFactory, IConfiguration configuration)
    {
        _clientFactory = clientFactory;
        _configuration = configuration;
    }

    [HttpPost("plan")]
    [RequestSizeLimit(16384)]
    public Task<IActionResult> Plan([FromBody] JsonElement body, CancellationToken cancellationToken)
        => Forward(HttpMethod.Post, "plan", body.GetRawText(), cancellationToken);

    [HttpGet("health")]
    public Task<IActionResult> Health(CancellationToken cancellationToken)
        => Forward(HttpMethod.Get, "health", null, cancellationToken);

    private async Task<IActionResult> Forward(HttpMethod method, string path, string? body, CancellationToken cancellationToken)
    {
        var configured = _configuration["FarmPlanningAgent:BaseUrl"] ?? "http://localhost:8001/";
        if (!Uri.TryCreate(configured, UriKind.Absolute, out var origin))
        {
            return StatusCode(503, new { message = "Farm Planning Agent address is not configured correctly." });
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
            var client = _clientFactory.CreateClient("FarmPlanningAgentGateway");
            using var response = await client.SendAsync(request, cancellationToken);

            if ((int)response.StatusCode >= 500 || (int)response.StatusCode is >= 300 and < 400)
            {
                return StatusCode(502, new { message = "Farm Planning Agent internal service unavailable." });
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
            return StatusCode(504, new { message = "Farm Planning Agent timed out." });
        }
        catch (Exception ex) when (ex is HttpRequestException or JsonException)
        {
            return StatusCode(502, new { message = "Farm Planning Agent connection failed.", error = ex.Message });
        }
    }
}
