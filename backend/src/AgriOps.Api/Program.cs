using Microsoft.EntityFrameworkCore;
using AgriOps.Core.Interfaces;
using AgriOps.Infrastructure.Data;
using AgriOps.Infrastructure.Services;
using AgriOpsAI.Api.Data;
using AgriOpsAI.Api.Services;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// 1. Add DB Context (PostgreSQL with EF Core)
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection") 
    ?? "Host=localhost;Port=5432;Database=agriops_db;Username=postgres;Password=postgres";

builder.Services.AddDbContext<ApplicationDbContext>((sp, options) =>
{
    options.UseNpgsql(connectionString, b => b.MigrationsAssembly("AgriOps.Infrastructure"));
    options.ConfigureWarnings(w => w.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.RelationalEventId.PendingModelChangesWarning));
    options.AddInterceptors(sp.GetRequiredService<AuditLogInterceptor>());
});

// Provide backward-compatible AgriOpsDbContext alias for Component 3 & 4 controllers
builder.Services.AddScoped<AgriOpsAI.Api.Data.AgriOpsDbContext>();

// 2. Register Application Services (All Components)
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<AuditLogInterceptor>();

// Component 1 & 2 Services
builder.Services.AddScoped<ITaskService, TaskService>();
builder.Services.AddScoped<ICropAnalysisService, CropAnalysisService>();
builder.Services.AddScoped<IWorkerService, WorkerService>();
builder.Services.AddScoped<WorkerSkillMatcher>();

// Component 3 Services
builder.Services.AddScoped<InventoryService>();
builder.Services.AddScoped<InventoryTransactionService>();
builder.Services.AddHostedService<AutomaticReorderWorker>();
builder.Services.AddScoped<InventoryServiceIdentity>();
builder.Services.AddScoped<SupplierService>();
builder.Services.AddScoped<SupplierItemService>();
builder.Services.AddScoped<PurchaseRequestService>();
builder.Services.AddScoped<ReorderRecommendationService>();

builder.Services.AddHttpClient("InventoryAgentGateway", client => {
    client.Timeout = TimeSpan.FromSeconds(110);
    client.MaxResponseContentBufferSize = 1024 * 1024;
}).ConfigurePrimaryHttpMessageHandler(() => new HttpClientHandler { AllowAutoRedirect = false, UseCookies = false });

builder.Services.AddHttpClient("AnalyticsAgentGateway", client => {
    client.Timeout = TimeSpan.FromSeconds(60);
    client.MaxResponseContentBufferSize = 1024 * 1024;
}).ConfigurePrimaryHttpMessageHandler(() => new HttpClientHandler { AllowAutoRedirect = false, UseCookies = false });

builder.Services.AddHttpClient("FarmPlanningAgentGateway", client => {
    client.Timeout = TimeSpan.FromSeconds(60);
    client.MaxResponseContentBufferSize = 1024 * 1024;
}).ConfigurePrimaryHttpMessageHandler(() => new HttpClientHandler { AllowAutoRedirect = false, UseCookies = false });

builder.Services.AddHttpClient("CropAnalysisAgentGateway", client => {
    client.Timeout = TimeSpan.FromSeconds(90);
    client.MaxResponseContentBufferSize = 1024 * 1024;
}).ConfigurePrimaryHttpMessageHandler(() => new HttpClientHandler { AllowAutoRedirect = false, UseCookies = false });

builder.Services.AddHttpClient("WeatherApiClient", client => {
    client.Timeout = TimeSpan.FromSeconds(10);
});

// Component 4 Services & Agent 4 Validation Safety
builder.Services.AddScoped<ITokenService, TokenService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IAuditLogService, AuditLogService>();
builder.Services.AddScoped<IWeatherService, WeatherService>();
builder.Services.AddScoped<IValidationSafetyService, ValidationSafetyService>();

// 3. Configure CORS for Web Dashboard & Cloud Deployment
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.SetIsOriginAllowed(_ => true)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// 4. Configure Authentication & Authorization
var jwtKey = builder.Configuration["Jwt:Key"]
    ?? builder.Configuration["Jwt__Key"]
    ?? "AgriOpsPlatformSecretSigningKeyForEvaluationAndDockerEnvironment2026!";
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "AgriOpsAI";
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "AgriOpsAIUsers";

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false;
    options.SaveToken = true;
    options.MapInboundClaims = false;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidIssuer = jwtIssuer,
        ValidateAudience = true,
        ValidAudience = jwtAudience,
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
        ValidateLifetime = true,
        RequireExpirationTime = true,
        ClockSkew = TimeSpan.FromMinutes(5),
        RoleClaimType = System.Security.Claims.ClaimTypes.Role,
        NameClaimType = System.Security.Claims.ClaimTypes.Name
    };
});

builder.Services.AddAuthorization(options =>
{
    InventoryPermissions.Configure(options);
});

// 5. Add API Controllers & Swagger
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo
    {
        Title = "AgriOps Platform API",
        Version = "v1",
        Description = "Centralized REST API for Farm & Crop Management, Workforce Coordination, and AI Crop Analysis"
    });
});

var app = builder.Build();

// 6. Automatic Database Schema Initialization Execution
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    var logger = services.GetRequiredService<ILogger<Program>>();
    try
    {
        var dbContext = services.GetRequiredService<ApplicationDbContext>();
        logger.LogInformation("Initializing PostgreSQL Database schema for all Component 1 & 2 entities...");
        
        await dbContext.Database.EnsureCreatedAsync();

        // 1. Direct Schema Guard: Ensure Component 4 columns and tables exist
        var schemaGuardSql = @"
            ALTER TABLE IF EXISTS ""Users"" ADD COLUMN IF NOT EXISTS ""ContactNumber"" character varying(20);
            ALTER TABLE IF EXISTS ""Users"" ADD COLUMN IF NOT EXISTS ""FullName"" character varying(100) DEFAULT '';
            ALTER TABLE IF EXISTS ""Users"" ADD COLUMN IF NOT EXISTS ""IsActive"" boolean DEFAULT true;
            ALTER TABLE IF EXISTS ""Users"" ADD COLUMN IF NOT EXISTS ""CreatedAt"" timestamp with time zone DEFAULT NOW();
            ALTER TABLE IF EXISTS ""Users"" ADD COLUMN IF NOT EXISTS ""UpdatedAt"" timestamp with time zone DEFAULT NOW();
            ALTER TABLE IF EXISTS ""Users"" ADD COLUMN IF NOT EXISTS ""PasswordHash"" text DEFAULT '';
            ALTER TABLE IF EXISTS ""Users"" ADD COLUMN IF NOT EXISTS ""Email"" character varying(150) DEFAULT '';

            CREATE TABLE IF NOT EXISTS ""AuditLogs"" (
                ""Id"" uuid NOT NULL PRIMARY KEY,
                ""UserId"" uuid,
                ""ActionType"" character varying(50) NOT NULL,
                ""IpAddress"" character varying(45),
                ""Details"" text,
                ""Timestamp"" timestamp with time zone NOT NULL DEFAULT NOW()
            );
            DO $$
            DECLARE
                col RECORD;
            BEGIN
                IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'AuditLogs') THEN
                    FOR col IN
                        SELECT column_name
                        FROM information_schema.columns
                        WHERE table_name = 'AuditLogs'
                          AND is_nullable = 'NO'
                          AND column_name != 'Id'
                    LOOP
                        EXECUTE format('ALTER TABLE ""AuditLogs"" ALTER COLUMN %I DROP NOT NULL;', col.column_name);
                    END LOOP;
                END IF;
            END $$;

            ALTER TABLE IF EXISTS ""AuditLogs"" ADD COLUMN IF NOT EXISTS ""EntityName"" character varying(100) DEFAULT '';
            ALTER TABLE IF EXISTS ""AuditLogs"" ADD COLUMN IF NOT EXISTS ""Action"" character varying(100) DEFAULT '';
            ALTER TABLE IF EXISTS ""AuditLogs"" ADD COLUMN IF NOT EXISTS ""ActionType"" character varying(100) DEFAULT '';
            ALTER TABLE IF EXISTS ""AuditLogs"" ADD COLUMN IF NOT EXISTS ""Details"" text;
            ALTER TABLE IF EXISTS ""AuditLogs"" ADD COLUMN IF NOT EXISTS ""IpAddress"" character varying(45);
            ALTER TABLE IF EXISTS ""AuditLogs"" ADD COLUMN IF NOT EXISTS ""Timestamp"" timestamp with time zone DEFAULT NOW();
            ALTER TABLE IF EXISTS ""AuditLogs"" ADD COLUMN IF NOT EXISTS ""UserId"" uuid;

            CREATE TABLE IF NOT EXISTS ""Roles"" (
                ""Id"" uuid NOT NULL PRIMARY KEY,
                ""RoleName"" character varying(50) NOT NULL,
                ""Description"" character varying(250),
                ""PermissionsMatrix"" text
            );
            ALTER TABLE IF EXISTS ""Roles"" ADD COLUMN IF NOT EXISTS ""RoleName"" character varying(50);
            ALTER TABLE IF EXISTS ""Roles"" ADD COLUMN IF NOT EXISTS ""Description"" character varying(250);
            ALTER TABLE IF EXISTS ""Roles"" ADD COLUMN IF NOT EXISTS ""PermissionsMatrix"" text;

            CREATE TABLE IF NOT EXISTS ""UserRoles"" (
                ""Id"" uuid NOT NULL PRIMARY KEY,
                ""UserId"" uuid NOT NULL,
                ""RoleId"" uuid NOT NULL
            );
            ALTER TABLE IF EXISTS ""UserRoles"" ADD COLUMN IF NOT EXISTS ""UserId"" uuid;
            ALTER TABLE IF EXISTS ""UserRoles"" ADD COLUMN IF NOT EXISTS ""RoleId"" uuid;

            CREATE TABLE IF NOT EXISTS ""ValidationResults"" (
                ""Id"" uuid NOT NULL PRIMARY KEY,
                ""ProposalId"" character varying(100) NOT NULL,
                ""GeneratingAgent"" character varying(100) NOT NULL,
                ""TargetFieldId"" uuid,
                ""CropVariety"" character varying(100) NOT NULL,
                ""ProposedAction"" character varying(150) NOT NULL,
                ""ProposedQuantity"" numeric(10,2) NOT NULL,
                ""UnitOfMeasurement"" character varying(50) NOT NULL,
                ""IsValid"" boolean NOT NULL,
                ""Decision"" character varying(50) NOT NULL,
                ""CheckResultsJson"" text NOT NULL,
                ""WeatherSnapshotJson"" text NOT NULL,
                ""FailureReasonsJson"" text NOT NULL,
                ""RevisionGuidance"" text,
                ""RequiresHumanApproval"" boolean NOT NULL,
                ""CreatedAt"" timestamp with time zone NOT NULL DEFAULT NOW()
            );
        ";
        try
        {
            await dbContext.Database.ExecuteSqlRawAsync(schemaGuardSql);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Schema guard notice: continuing with standard seeding");
        }

        await DbInitializer.SeedAsync(dbContext);

        // Safely execute Components 3 & 4 migration script if tables don't exist yet
        var scriptPath = Path.Combine(AppContext.BaseDirectory, "component_3_and_4_migration.sql");
        if (!File.Exists(scriptPath))
            scriptPath = Path.Combine(Directory.GetCurrentDirectory(), "component_3_and_4_migration.sql");
        if (!File.Exists(scriptPath))
            scriptPath = Path.Combine(Directory.GetCurrentDirectory(), "backend", "component_3_and_4_migration.sql");

        if (File.Exists(scriptPath))
        {
            logger.LogInformation("Applying Components 3 & 4 database migration script...");
            var sql = await File.ReadAllTextAsync(scriptPath);
            await dbContext.Database.ExecuteSqlRawAsync(sql);
            logger.LogInformation("Components 3 & 4 database tables verified successfully.");
        }

        logger.LogInformation("PostgreSQL Database schema created and verified successfully.");
    }
    catch (Exception ex)
    {
        logger.LogWarning(ex, "Note: Database initialization deferred (PostgreSQL server offline or pending connection).");
    }
}

// 7. Configure HTTP pipeline & Swagger UI (Always enabled for Evaluation & Cloud Deployments)
app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "AgriOps Platform API v1");
    c.RoutePrefix = "swagger";
});

// Health check endpoints required by Assignment Specification (Sections 14 & 15)
app.MapGet("/health", () => Results.Ok(new 
{ 
    status = "Healthy", 
    service = "AgriOps RESTful API", 
    timestamp = DateTime.UtcNow 
}));
app.MapGet("/api/health", () => Results.Ok(new 
{ 
    status = "Healthy", 
    service = "AgriOps RESTful API", 
    timestamp = DateTime.UtcNow 
}));

if (app.Configuration.GetValue<bool>("UseHttpsRedirection", false))
{
    app.UseHttpsRedirection();
}
app.UseCors("AllowFrontend");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();

// Lets the test projects start the real app via WebApplicationFactory<Program>
public partial class Program { }
