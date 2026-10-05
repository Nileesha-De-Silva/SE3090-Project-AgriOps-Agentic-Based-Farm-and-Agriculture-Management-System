using System.IdentityModel.Tokens.Jwt;
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using AgriOpsAI.Api.Controllers;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.IdentityModel.Tokens;

var key = new SymmetricSecurityKey(RandomNumberGenerator.GetBytes(64));
var upstream = new AgentDouble();
var apiPath = Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "../../../../../backend/AgriOpsAI.Api"));
WebApplicationFactory<AgentGatewayController> Factory(string origin = "http://127.0.0.1:8003/") =>
    new WebApplicationFactory<AgentGatewayController>().WithWebHostBuilder(host =>
    {
        host.UseEnvironment("Development").UseContentRoot(apiPath);
        host.ConfigureLogging(logging => logging.ClearProviders());
        host.ConfigureAppConfiguration((_, config) => config.AddInMemoryCollection(new Dictionary<string, string?> {
            ["InventoryAgent:BaseUrl"] = origin,
            ["Authentication:ManagerRole"] = "Manager", ["Authentication:AgentRole"] = "InventoryAgent"
        }));
        host.ConfigureServices(services => {
            services.PostConfigure<JwtBearerOptions>(JwtBearerDefaults.AuthenticationScheme, jwt => {
                jwt.Authority = null; jwt.ConfigurationManager = null;
                jwt.TokenValidationParameters.ValidIssuer = "gateway-checks";
                jwt.TokenValidationParameters.ValidAudience = "gateway-checks";
                jwt.TokenValidationParameters.IssuerSigningKey = key;
                jwt.TokenValidationParameters.RoleClaimType = "role";
            });
            services.AddHttpClient("InventoryAgentGateway").ConfigurePrimaryHttpMessageHandler(() => upstream);
        });
    });
string Token(params string[] roles) => new JwtSecurityTokenHandler().WriteToken(new JwtSecurityToken(
    issuer: "gateway-checks", audience: "gateway-checks",
    claims: new[] { new Claim("sub", "test-manager") }.Concat(roles.Select(r => new Claim("role", r))),
    expires: DateTime.UtcNow.AddMinutes(5), signingCredentials: new SigningCredentials(key, SecurityAlgorithms.HmacSha256)));
void Check(bool condition, string description) { if (!condition) throw new Exception(description); }
using var factory = Factory();
using var client = factory.CreateClient(new WebApplicationFactoryClientOptions { BaseAddress = new Uri("https://localhost"), AllowAutoRedirect = false });
var runId = Guid.NewGuid();
var runPath = $"/api/inventory-agent/runs/{runId}";
Check((await client.GetAsync(runPath)).StatusCode == HttpStatusCode.Unauthorized, "Anonymous gateway request must fail");
foreach (var roles in new[] { new[] { "InventoryAgent" }, new[] { "Manager", "InventoryAgent" } }) {
    client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", Token(roles));
    Check((await client.GetAsync(runPath)).StatusCode == HttpStatusCode.Forbidden, "Service/dual-role identity must not use manager gateway");
}
Check(upstream.Calls == 0, "Denied requests reached Python");
Console.WriteLine("PASS 1: Anonymous, agent and dual-role requests never reach Python");
var manager = Token("Manager");
client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", manager);
var body = new { request_id = runId, inventory_item_id = Guid.NewGuid(), message = "Prefer quick delivery", safety_days = 7 };
Check((await client.PostAsJsonAsync("/api/inventory-agent/recommend", body)).IsSuccessStatusCode, "Manager request failed");
Check(upstream.LastUri == "http://127.0.0.1:8003/recommend" && upstream.LastToken == manager && upstream.LastBody!.Contains(runId.ToString()), "Forwarded identity, path or input changed");
Console.WriteLine("PASS 2: Manager identity and request ID are preserved through ASP.NET Core");
await client.GetAsync(runPath);
Check(upstream.LastUri!.EndsWith($"runs/{runId}") && upstream.LastMethod == HttpMethod.Get, "Status route changed");
await client.PostAsync(runPath + "/resume", null);
Check(upstream.LastUri!.EndsWith($"runs/{runId}/resume") && upstream.LastMethod == HttpMethod.Post, "Resume route changed");
Console.WriteLine("PASS 3: Status and resume use fixed internal routes");
upstream.Status = HttpStatusCode.Conflict;
Check((await client.PostAsync(runPath + "/resume", null)).StatusCode == HttpStatusCode.Conflict, "Conflict was not preserved");
Console.WriteLine("PASS 4: Pending-decision conflicts remain conflicts");
foreach (var status in new[] { HttpStatusCode.Redirect, HttpStatusCode.InternalServerError }) {
    upstream.Status = status; upstream.Body = "provider-private-error";
    var response = await client.GetAsync(runPath);
    Check(response.StatusCode == HttpStatusCode.BadGateway && !(await response.Content.ReadAsStringAsync()).Contains("provider-private-error"), "Upstream error leaked");
}
upstream.Status = HttpStatusCode.OK; upstream.Body = "<html>not JSON</html>";
Check((await client.GetAsync(runPath)).StatusCode == HttpStatusCode.BadGateway, "Malformed JSON accepted");
Console.WriteLine("PASS 5: Redirects, provider failures and malformed responses fail safely");
upstream.Timeout = true;
Check((await client.PostAsync(runPath + "/resume", null)).StatusCode == HttpStatusCode.GatewayTimeout, "Timeout did not preserve uncertain result");
upstream.Timeout = false;
Console.WriteLine("PASS 6: Timed-out writes report a timeout without retrying");
using var invalidFactory = Factory("http://untrusted.example/");
using var invalid = invalidFactory.CreateClient(new WebApplicationFactoryClientOptions { BaseAddress = new Uri("https://localhost") });
invalid.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", manager);
var count = upstream.Calls;
Check((await invalid.GetAsync(runPath)).StatusCode == HttpStatusCode.ServiceUnavailable && count == upstream.Calls, "Insecure non-loopback origin accepted");
Console.WriteLine("PASS 7: Insecure remote agent configuration fails before credentials are forwarded");
Console.WriteLine("RESULT: 7/7 gateway groups passed. Python, Gemini and PostgreSQL were not called.");

sealed class AgentDouble : HttpMessageHandler
{
    public int Calls;
    public string? LastUri, LastToken, LastBody;
    public HttpMethod? LastMethod;
    public HttpStatusCode Status = HttpStatusCode.OK;
    public string Body = "{\"status\":\"awaiting_approval\"}";
    public bool Timeout;
    protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
    {
        Calls++; LastUri = request.RequestUri!.ToString(); LastToken = request.Headers.Authorization?.Parameter; LastMethod = request.Method;
        LastBody = request.Content is null ? null : await request.Content.ReadAsStringAsync(cancellationToken);
        if (Timeout) throw new TaskCanceledException();
        return new HttpResponseMessage(Status) { Content = new StringContent(Body, Encoding.UTF8, "application/json") };
    }
}
