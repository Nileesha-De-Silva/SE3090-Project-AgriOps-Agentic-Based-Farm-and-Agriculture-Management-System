using System.IdentityModel.Tokens.Jwt;
using System.Text;
using System.Text.Json.Serialization;
using AgriOpsAI.Api.Data;
using AgriOpsAI.Api.Models;
using AgriOpsAI.Api.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

// ---------- Core ----------
// Enum-as-string JSON is needed by Component 1 (e.g. CropSeason status)
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// ---------- Database ----------
// ONE registration for everyone. Component 4's audit interceptor is attached here,
// so every SaveChanges across all components is written to the audit log.
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<AuditLogInterceptor>();
builder.Services.AddDbContext<AgriOpsDbContext>((serviceProvider, options) =>
{
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection"));
    options.AddInterceptors(serviceProvider.GetRequiredService<AuditLogInterceptor>());
});

// ---------- Component 3: inventory ----------
builder.Services.AddHttpClient("InventoryAgentGateway", client => {
    client.Timeout = TimeSpan.FromSeconds(110);
    client.MaxResponseContentBufferSize = 1024 * 1024;
})
    .ConfigurePrimaryHttpMessageHandler(() => new HttpClientHandler { AllowAutoRedirect = false, UseCookies = false });

builder.Services.AddScoped<InventoryService>();
builder.Services.AddScoped<InventoryTransactionService>();
builder.Services.AddScoped<SupplierService>();
builder.Services.AddScoped<SupplierItemService>();
builder.Services.AddScoped<PurchaseRequestService>();
builder.Services.AddScoped<ReorderRecommendationService>();

// ---------- Component 4: auth + audit services ----------
builder.Services.AddScoped<ITokenService, TokenService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IAuditLogService, AuditLogService>();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactDev", policy =>
    {
        policy.WithOrigins("http://localhost:5173", "http://localhost:5000")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// ---------- Authentication: two token sources, one app ----------
// 1) "Bearer"        - Component 3's external identity provider (inventory manager / agent tokens)
// 2) "AgriOpsLocal"  - Component 4's own tokens, issued by /api/auth/login
// "MultiAuth" is the default: it peeks at each token's issuer and forwards the request
// to whichever validator owns it. Requests with no token go to "Bearer", as before.
const string LocalScheme = "AgriOpsLocal";

var jwtKey = builder.Configuration["Jwt:Key"]
    ?? throw new InvalidOperationException("Jwt:Key is missing from appsettings.");
var localIssuer = builder.Configuration["Jwt:Issuer"];
var tokenReader = new JwtSecurityTokenHandler();

builder.Services.AddAuthentication(options =>
    {
        options.DefaultScheme = "MultiAuth";
        options.DefaultChallengeScheme = "MultiAuth";
    })
    .AddPolicyScheme("MultiAuth", "Local or external bearer token", options =>
    {
        options.ForwardDefaultSelector = context =>
        {
            var header = context.Request.Headers.Authorization.ToString();
            if (header.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
            {
                var token = header["Bearer ".Length..].Trim();
                if (tokenReader.CanReadToken(token)
                    && tokenReader.ReadJwtToken(token).Issuer == localIssuer)
                {
                    return LocalScheme;
                }
            }
            return JwtBearerDefaults.AuthenticationScheme;
        };
    })
    // Component 3's configuration, unchanged
    .AddJwtBearer(JwtBearerDefaults.AuthenticationScheme, options =>
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
    })
    // Component 4's configuration
    .AddJwtBearer(LocalScheme, options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidateAudience = true,
            ValidAudience = builder.Configuration["Jwt:Audience"],
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
            ValidateLifetime = true,
            ClockSkew = TimeSpan.Zero
        };
    });

// ---------- Authorization: Component 3's policies, unchanged ----------
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

var app = builder.Build();

// Component 4: seed the four fixed roles on startup so registration has something to reference.
// Idempotent: only inserts roles that don't already exist.
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AgriOpsDbContext>();
    var requiredRoles = new[] { "Farmer", "FarmWorker", "FarmManager", "Administrator" };

    foreach (var roleName in requiredRoles)
    {
        if (!db.Roles.Any(r => r.RoleName == roleName))
        {
            db.Roles.Add(new Role { Id = Guid.NewGuid(), RoleName = roleName });
        }
    }

    db.SaveChanges();

    // Bootstrap: registration is Administrator-only, so if no user exists yet,
    // nobody could ever create the first one. This runs once - after an
    // Administrator exists, !db.Users.Any() is false forever and this is skipped.
    if (!db.Users.Any())
    {
        var adminRole = db.Roles.First(r => r.RoleName == "Administrator");

        var bootstrapAdmin = new User
        {
            Id = Guid.NewGuid(),
            Username = "admin",
            Email = "admin@agriops.local",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("ChangeMe123!"),
            FullName = "Bootstrap Administrator",
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        db.Users.Add(bootstrapAdmin);
        db.UserRoles.Add(new UserRole
        {
            Id = Guid.NewGuid(),
            UserId = bootstrapAdmin.Id,
            RoleId = adminRole.Id
        });

        db.SaveChanges();
    }
}

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseCors("AllowReactDev");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// Quick sanity-check endpoint: hit this with a Bearer token in Swagger/Postman
// to confirm JWT auth is actually working.
app.MapGet("/api/protected-test", () => "You're authenticated.")
    .RequireAuthorization();

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

app.Run();

record WeatherForecast(DateOnly Date, int TemperatureC, string? Summary)
{
    public int TemperatureF => 32 + (int)(TemperatureC / 0.5556);
}

// Lets the test projects start the real app via WebApplicationFactory<Program>
public partial class Program { }