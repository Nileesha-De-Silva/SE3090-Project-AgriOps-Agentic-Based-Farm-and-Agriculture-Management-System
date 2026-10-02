using System;
using Microsoft.EntityFrameworkCore;
using AgriOps.Infrastructure.Data;

namespace AgriOps.Tests.Helpers;

public static class TestDbContextFactory
{
    public const string ConnectionString = "Host=localhost;Port=5432;Database=agriops_test_db;Username=postgres;Password=NileesHa2003#";

    private static readonly object _lock = new();
    private static bool _initialized = false;

    public static ApplicationDbContext CreateDbContext()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseNpgsql(ConnectionString)
            .EnableSensitiveDataLogging()
            .Options;

        var context = new ApplicationDbContext(options);

        lock (_lock)
        {
            if (!_initialized)
            {
                context.Database.EnsureCreated();
                _initialized = true;
            }
        }

        return context;
    }

    public static async Task ResetDatabaseAsync(ApplicationDbContext context)
    {
        await context.Database.ExecuteSqlRawAsync(@"
            DELETE FROM ""TaskHistories"";
            DELETE FROM ""TaskAssignments"";
            DELETE FROM ""TaskSchedules"";
            DELETE FROM ""ApprovalItems"";
            DELETE FROM ""CropAnalysisAssessments"";
            DELETE FROM ""Tasks"";
            DELETE FROM ""WorkerSkills"";
            DELETE FROM ""Workers"";
            DELETE FROM ""SoilRecords"";
            DELETE FROM ""Harvests"";
            DELETE FROM ""Plantings"";
            DELETE FROM ""CropSeasons"";
            DELETE FROM ""Crops"";
            DELETE FROM ""Fields"";
            DELETE FROM ""Farms"";
        ");
    }
}
