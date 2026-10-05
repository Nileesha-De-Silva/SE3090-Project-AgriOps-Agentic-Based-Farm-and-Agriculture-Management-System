using Microsoft.EntityFrameworkCore;
using AgriOps.Core.Interfaces;
using AgriOps.Infrastructure.Data;
using AgriOps.Infrastructure.Services;
using System.Text.Json.Serialization;

var builder = WebApplication.CreateBuilder(args);

// 1. Add DB Context (PostgreSQL with EF Core)
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection") 
    ?? "Host=localhost;Port=5432;Database=agriops_db;Username=postgres;Password=postgres";

builder.Services.AddDbContext<ApplicationDbContext>(options =>
{
    options.UseNpgsql(connectionString, b => b.MigrationsAssembly("AgriOps.Infrastructure"));
    options.ConfigureWarnings(w => w.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.RelationalEventId.PendingModelChangesWarning));
});

// 2. Register Application Services
builder.Services.AddScoped<ITaskService, TaskService>();
builder.Services.AddScoped<ICropAnalysisService, CropAnalysisService>();
builder.Services.AddScoped<IWorkerService, WorkerService>();
builder.Services.AddScoped<WorkerSkillMatcher>();

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

// 4. Add API Controllers & Swagger
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

// 4. Automatic Database Schema Initialization Execution
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    var logger = services.GetRequiredService<ILogger<Program>>();
    try
    {
        var dbContext = services.GetRequiredService<ApplicationDbContext>();
        logger.LogInformation("Initializing PostgreSQL Database schema for all Component 1 & 2 entities...");
        
        await dbContext.Database.EnsureCreatedAsync();
        await DbInitializer.SeedAsync(dbContext);
        logger.LogInformation("PostgreSQL Database schema created and verified successfully.");
    }
    catch (Exception ex)
    {
        logger.LogWarning(ex, "Note: Database initialization deferred (PostgreSQL server offline or pending connection).");
    }
}

// 5. Configure HTTP pipeline & Swagger UI (Always enabled for Evaluation & Cloud Deployments)
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

app.UseHttpsRedirection();
app.UseCors("AllowFrontend");
app.UseAuthorization();
app.MapControllers();

app.Run();
