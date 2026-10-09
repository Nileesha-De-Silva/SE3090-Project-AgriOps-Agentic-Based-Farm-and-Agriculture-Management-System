using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using AgriOps.Infrastructure.Data;

namespace AgriOps.IntegrationTests.Infrastructure;

public static class TestDatabaseConfig
{
    public const string ConnectionString = "Host=localhost;Port=5432;Database=agriops_integration_test_db;Username=postgres;Password=NileesHa2003#";

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
