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
});

// 2. Register Application Services
builder.Services.AddScoped<ITaskService, TaskService>();
builder.Services.AddScoped<ICropAnalysisService, CropAnalysisService>();
builder.Services.AddScoped<IWorkerService, WorkerService>();
builder.Services.AddScoped<WorkerSkillMatcher>();

// 3. Configure CORS for Web Dashboard
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:5173", "http://localhost:3000", "http://localhost:5000")
              .AllowAnyHeader()
              .AllowAnyMethod();
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

// 4. Automatic Database Migration & Seeding Execution
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    var logger = services.GetRequiredService<ILogger<Program>>();
    try
    {
        var dbContext = services.GetRequiredService<ApplicationDbContext>();
        logger.LogInformation("Applying EF Core Migrations and Seeding Initial Data...");
        
        if (dbContext.Database.IsNpgsql())
        {
            await dbContext.Database.MigrateAsync();
        }
        else
        {
            await dbContext.Database.EnsureCreatedAsync();
        }
        
        await DbInitializer.SeedAsync(dbContext);
        logger.LogInformation("PostgreSQL Database Migration and Seed Data executed successfully.");
    }
    catch (Exception ex)
    {
        logger.LogWarning(ex, "Note: Database initialization deferred (PostgreSQL server offline or pending connection). Migration script ready.");
    }
}

// 5. Configure HTTP pipeline & Swagger UI
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseCors("AllowFrontend");
app.UseAuthorization();
app.MapControllers();

app.Run();
