using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;

namespace AgriOps.Infrastructure.Data;

public static class DbInitializer
{
    public static async Task SeedAsync(ApplicationDbContext context)
    {
        // Ensures the PostgreSQL database and tables are created without injecting hardcoded mock data.
        // All Workers, Tasks, and Crop Analysis records will be created purely via user inputs.
        await context.Database.EnsureCreatedAsync();
    }
}
