using Microsoft.EntityFrameworkCore;
using AgriOpsAI.Api.Data;
using AgriOpsAI.Api.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle

builder.Services.AddDbContext<AgriOpsDbContext>(options =>
    options.UseNpgsql(
        builder.Configuration.GetConnectionString("DefaultConnection")
    ));

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddControllers();
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.Authority = builder.Configuration["Authentication:Authority"];
        options.Audience = builder.Configuration["Authentication:Audience"];
        options.RequireHttpsMetadata = true;
        options.MapInboundClaims = false;
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            RequireSignedTokens = true,
            RequireExpirationTime = true,
            ClockSkew = TimeSpan.FromSeconds(30),
            NameClaimType = "sub",
            RoleClaimType = builder.Configuration["Authentication:RoleClaimType"] ?? "role"
        };
    });
var managerRole = builder.Configuration["Authentication:ManagerRole"] ?? "Manager";
var agentRole = builder.Configuration["Authentication:AgentRole"] ?? "InventoryAgent";
if (managerRole == agentRole) throw new InvalidOperationException("Manager and agent roles must be different.");
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("Manager", policy => policy.RequireAuthenticatedUser().RequireClaim("sub").RequireClaim("iss")
        .RequireRole(managerRole).RequireAssertion(auth => !auth.User.IsInRole(agentRole)));
    options.AddPolicy("InventoryAgent", policy => policy.RequireAuthenticatedUser().RequireClaim("sub").RequireClaim("iss")
        .RequireRole(agentRole).RequireAssertion(auth => !auth.User.IsInRole(managerRole)));
    options.AddPolicy("RecommendationReader", policy => policy.RequireAuthenticatedUser().RequireClaim("sub")
        .RequireRole(managerRole, agentRole));
});
builder.Services.AddScoped<InventoryService>();
builder.Services.AddScoped<InventoryTransactionService>();
builder.Services.AddScoped<SupplierService>();
builder.Services.AddScoped<SupplierItemService>();
builder.Services.AddScoped<PurchaseRequestService>();
builder.Services.AddScoped<ReorderRecommendationService>();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();

var summaries = new[]
{
    "Freezing", "Bracing", "Chilly", "Cool", "Mild", "Warm", "Balmy", "Hot", "Sweltering", "Scorching"
};

app.MapGet("/weatherforecast", () =>
{
    var forecast =  Enumerable.Range(1, 5).Select(index =>
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
