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
/// Gateway controller for Agent 2: Crop Analysis & Diagnostic Subsystem.
/// Enforces the Mandatory Backend Rule: Clients communicate exclusively through ASP.NET Core.
/// </summary>
[ApiController]
[Route("api/crop-analysis-agent")]
public sealed class CropAnalysisAgentGatewayController : ControllerBase
{
    private readonly IHttpClientFactory _clientFactory;
    private readonly IConfiguration _configuration;

    public CropAnalysisAgentGatewayController(IHttpClientFactory clientFactory, IConfiguration configuration)
    {
        _clientFactory = clientFactory;
        _configuration = configuration;
    }

    [HttpPost("analyze")]
    [RequestSizeLimit(32768)]
    public Task<IActionResult> Analyze([FromBody] JsonElement body, CancellationToken cancellationToken)
        => Forward(HttpMethod.Post, "analyze", body.GetRawText(), cancellationToken);

    [HttpPost("resume")]
    [RequestSizeLimit(16384)]
    public async Task<IActionResult> Resume([FromBody] JsonElement body, CancellationToken cancellationToken)
    {
        using var cts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
        cts.CancelAfter(TimeSpan.FromSeconds(5));
        return await Forward(HttpMethod.Post, "resume", body.GetRawText(), cts.Token);
    }

    [HttpGet("threads/{id}")]
    public Task<IActionResult> GetThread(string id, CancellationToken cancellationToken)
        => Forward(HttpMethod.Get, $"threads/{id}", null, cancellationToken);

    [HttpGet("tools")]
    public Task<IActionResult> GetTools(CancellationToken cancellationToken)
        => Forward(HttpMethod.Get, "tools", null, cancellationToken);

    [HttpGet("health")]
    public Task<IActionResult> Health(CancellationToken cancellationToken)
        => Forward(HttpMethod.Get, "health", null, cancellationToken);

    private async Task<IActionResult> Forward(HttpMethod method, string path, string? body, CancellationToken cancellationToken)
    {
        var configured = _configuration["CropAnalysisAgent:BaseUrl"] ?? "http://localhost:8000/";
        if (!Uri.TryCreate(configured, UriKind.Absolute, out var origin))
        {
            return StatusCode(503, new { message = "Crop Analysis Agent address is not configured correctly." });
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
            var client = _clientFactory.CreateClient("CropAnalysisAgentGateway");
            using var response = await client.SendAsync(request, cancellationToken);

            if ((int)response.StatusCode >= 500 || (int)response.StatusCode is >= 300 and < 400)
            {
                return StatusCode(502, new { message = "Crop Analysis Agent internal service unavailable." });
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
            return StatusCode(504, new { message = "Crop Analysis Agent timed out." });
        }
        catch (Exception ex) when (ex is HttpRequestException or JsonException)
        {
            return StatusCode(502, new { message = "Crop Analysis Agent connection failed.", error = ex.Message });
        }
    }
}
