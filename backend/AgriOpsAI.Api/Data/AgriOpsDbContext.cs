using Microsoft.EntityFrameworkCore;
using AgriOpsAI.Api.Models;

namespace AgriOpsAI.Api.Data;

public class AgriOpsDbContext : DbContext
{
    public AgriOpsDbContext(DbContextOptions<AgriOpsDbContext> options) : base(options)
    {
    }

    public DbSet<Farm> Farms {get;set;}
    public DbSet<Field> Fields {get;set;}
    public DbSet<Crop> Crops {get;set;}
    public DbSet<CropSeason> CropSeasons {get;set;}
    public DbSet<Planting> Plantings {get;set;}
    public DbSet<Harvest> Harvests {get;set;}
    public DbSet<SoilRecord> SoilRecords {get;set;}

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<CropSeason>()
            .HasOne(cs => cs.Field)
            .WithMany(f => f.CropSeasons)
            .HasForeignKey(cs => cs.FieldId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<CropSeason>()
            .HasOne(cs => cs.Crop)
            .WithMany(c => c.CropSeasons)
            .HasForeignKey(cs => cs.CropId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<SoilRecord>()
            .HasOne(sr=>sr.Field)
            .WithMany(f=>f.SoilRecords)
            .HasForeignKey(sr=>sr.FieldId)
            .OnDelete(DeleteBehavior.Cascade);

    }
}