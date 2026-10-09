using Microsoft.EntityFrameworkCore;

namespace AgriOpsAI.Api.Data;

public class AgriOpsDbContext : AgriOps.Infrastructure.Data.ApplicationDbContext
{
    public AgriOpsDbContext(DbContextOptions<AgriOps.Infrastructure.Data.ApplicationDbContext> options)
        : base(options)
    {
    }
}
