using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using AgriOpsAI.Api.Data;
using AgriOpsAI.Api.Models;
using AgriOpsAI.Api.Services;
using System.Text;
using System.Text.Json.Serialization;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// HttpClient for Inventory Agent Gateway
builder.Services.AddHttpClient("InventoryAgentGateway", client => {
    client.Timeout = TimeSpan.FromSeconds(110);
    client.MaxResponseContentBufferSize = 1024 * 1024;
})
.ConfigurePrimaryHttpMessageHandler(() => new HttpClientHandler { AllowAutoRedirect = false, UseCookies = false });

// Business Services
builder.Services.AddScoped<InventoryService>();
builder.Services.AddScoped<InventoryTransactionService>();
builder.Services.AddScoped<SupplierService>();
builder.Services.AddScoped<SupplierItemService>();
builder.Services.AddScoped<PurchaseRequestService>();
builder.Services.AddScoped<ReorderRecommendationService>();

// Component 4: Auth & Audit Services
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<AuditLogInterceptor>();
builder.Services.AddScoped<ITokenService, TokenService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IAuditLogService, AuditLogService>();

// Database & Interceptors
builder.Services.AddDbContext<AgriOpsDbContext>((serviceProvider, options) =>
{
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection"));
    options.AddInterceptors(serviceProvider.GetRequiredService<AuditLogInterceptor>());
});

// CORS Policy
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactDev", policy =>
    {
        policy.WithOrigins("http://localhost:5173", "http://localhost:5000")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// Authentication & JWT configuration
var jwtKey = builder.Configuration["Jwt:Key"] ?? "super_secret_default_key_for_development_purposes_only";

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"] ?? "AgriOpsAI",
            ValidateAudience = true,
            ValidAudience = builder.Configuration["Jwt:Audience"] ?? "AgriOpsAIUsers",
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
            ValidateLifetime = true,
            ClockSkew = TimeSpan.Zero
        };
    });

var managerRole = builder.Configuration["Authentication:ManagerRole"] ?? "Manager";
var agentRole = builder.Configuration["Authentication:AgentRole"] ?? "InventoryAgent";

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("Manager", policy => policy.RequireAuthenticatedUser().RequireClaim("sub")
        .RequireRole(managerRole).RequireAssertion(auth => !auth.User.IsInRole(agentRole)));
    options.AddPolicy("InventoryAgent", policy => policy.RequireAuthenticatedUser().RequireClaim("sub")
        .RequireRole(agentRole).RequireAssertion(auth => !auth.User.IsInRole(managerRole)));
    options.AddPolicy("RecommendationReader", policy => policy.RequireAuthenticatedUser().RequireClaim("sub")
        .RequireRole(managerRole, agentRole));
});

var app = builder.Build();

// Seed default roles on startup
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AgriOpsDbContext>();
    var requiredRoles = new[] { "Farmer", "FarmWorker", "FarmManager", "Administrator", "Manager" };

    foreach (var roleName in requiredRoles)
    {
        if (!db.Roles.Any(r => r.RoleName == roleName))
        {
            db.Roles.Add(new Role { Id = Guid.NewGuid(), RoleName = roleName });
        }
    }
    db.SaveChanges();
}

// Configure HTTP pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseCors("AllowReactDev");

app.UseAuthentication();
app.UseAuthorization();

// Weather forecast test endpoint
var summaries = new[] { "Freezing", "Bracing", "Chilly", "Cool", "Mild", "Warm", "Balmy", "Hot", "Sweltering", "Scorching" };

app.MapGet("/weatherforecast", () =>
{
    var forecast = Enumerable.Range(1, 5).Select(index =>
        new WeatherForecast
        (
            DateOnly.FromDateTime(DateTime.Now.AddDays(index)),
            Random.Shared.Next(-20, 55),
            summaries[Random.Shared.Next(summaries.Length)]
        ))
        .ToArray();
    return forecast;
})
.WithName("GetWeatherForecast");

app.MapControllers();
app.Run();

record WeatherForecast(DateOnly Date, int TemperatureC, string? Summary)
{
    public int TemperatureF => 32 + (int)(TemperatureC / 0.5556);
}

public partial class Program { }