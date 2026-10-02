using System;
using System.IO;
using System.Linq;
using System.Net.Http;
using System.Text.Json.Serialization;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using AgriOps.Core.Interfaces;
using AgriOps.Infrastructure.Data;
using AgriOps.Infrastructure.Services;
using Xunit;

namespace AgriOps.IntegrationTests.Infrastructure;

public class AgriOpsTestHost : IAsyncLifetime
{
    private WebApplication? _app;
    public HttpClient Client { get; private set; } = null!;
    public string BaseUrl { get; private set; } = null!;
    public IServiceProvider Services => _app!.Services;

    public async Task InitializeAsync()
    {
        var builder = WebApplication.CreateBuilder(new WebApplicationOptions
        {
            EnvironmentName = "Testing"
        });

        // Suppress verbose console logs during tests
        builder.Logging.ClearProviders();

        // 1. Configure Kestrel to listen on loopback ephemeral port
        builder.WebHost.UseUrls("http://127.0.0.1:0");

        // 2. Configure PostgreSQL DbContext for test DB
        builder.Services.AddDbContext<ApplicationDbContext>(options =>
        {
            options.UseNpgsql(TestDatabaseConfig.ConnectionString, b => b.MigrationsAssembly("AgriOps.Infrastructure"));
            options.ConfigureWarnings(w => w.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.RelationalEventId.PendingModelChangesWarning));
        });

        // 3. Register Domain & Infrastructure Services
        builder.Services.AddScoped<ITaskService, TaskService>();
        builder.Services.AddScoped<ICropAnalysisService, CropAnalysisService>();
        builder.Services.AddScoped<IWorkerService, WorkerService>();
        builder.Services.AddScoped<WorkerSkillMatcher>();

        // 4. Register API Controllers & JSON options
        builder.Services.AddControllers()
            .AddApplicationPart(typeof(AgriOps.Api.Controllers.FarmController).Assembly)
            .AddJsonOptions(options =>
            {
                options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
                options.JsonSerializerOptions.PropertyNameCaseInsensitive = true;
            });

        _app = builder.Build();

        // 5. Ensure DB schema exists
        using (var scope = _app.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            await db.Database.EnsureCreatedAsync();
        }

        _app.MapControllers();

        await _app.StartAsync();

        BaseUrl = _app.Urls.First();
        Client = new HttpClient
        {
            BaseAddress = new Uri(BaseUrl)
        };
    }

    public async Task DisposeAsync()
    {
        Client?.Dispose();
        if (_app != null)
        {
            await _app.StopAsync();
            await _app.DisposeAsync();
        }
    }
}
