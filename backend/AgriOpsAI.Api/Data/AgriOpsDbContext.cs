using Microsoft.EntityFrameworkCore;
using AgriOpsAI.Api.Models;

namespace AgriOpsAI.Api.Data;

public class AgriOpsDbContext : DbContext
{
    public AgriOpsDbContext(DbContextOptions<AgriOpsDbContext> options) : base(options)
    {
    }

    // Component 1 - Farm & Crop Management
    public DbSet<Farm> Farms {get;set;}
    public DbSet<Field> Fields {get;set;}
    public DbSet<Crop> Crops {get;set;}
    public DbSet<CropSeason> CropSeasons {get;set;}
    public DbSet<Planting> Plantings {get;set;}
    public DbSet<Harvest> Harvests {get;set;}
    public DbSet<SoilRecord> SoilRecords {get;set;}

    // Component 4 - Reporting, Analytics & User Management
    public DbSet<User> Users {get;set;}
    public DbSet<Role> Roles {get;set;}
    public DbSet<UserRole> UserRoles {get;set;}
    public DbSet<AuditLog> AuditLogs {get;set;}

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // --- Component 1 relationships (unchanged from teammate's version) ---
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

        // --- Component 4 relationships ---
        modelBuilder.Entity<User>()
            .HasIndex(u => u.Username)
            .IsUnique();

        modelBuilder.Entity<User>()
            .HasIndex(u => u.Email)
            .IsUnique();

        modelBuilder.Entity<UserRole>()
            .HasIndex(ur => new { ur.UserId, ur.RoleId })
            .IsUnique();

        modelBuilder.Entity<UserRole>()
            .HasOne(ur => ur.User)
            .WithMany(u => u.UserRoles)
            .HasForeignKey(ur => ur.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<UserRole>()
            .HasOne(ur => ur.Role)
            .WithMany(r => r.UserRoles)
            .HasForeignKey(ur => ur.RoleId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<AuditLog>()
            .HasOne(a => a.User)
            .WithMany(u => u.AuditLogs)
            .HasForeignKey(a => a.UserId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}