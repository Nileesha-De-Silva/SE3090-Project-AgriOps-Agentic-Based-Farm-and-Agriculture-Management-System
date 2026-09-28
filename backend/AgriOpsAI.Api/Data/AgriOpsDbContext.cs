using Microsoft.EntityFrameworkCore;
using AgriOpsAI.Api.Models;

namespace AgriOpsAI.Api.Data;

public class AgriOpsDbContext : DbContext
{
    public AgriOpsDbContext(DbContextOptions<AgriOpsDbContext> options) : base(options)
    {
    }

    // Component 1 - Farm & Crop Management
    public DbSet<Farm> Farms { get; set; }
    public DbSet<Field> Fields { get; set; }
    public DbSet<Crop> Crops { get; set; }
    public DbSet<CropSeason> CropSeasons { get; set; }
    public DbSet<Planting> Plantings { get; set; }
    public DbSet<Harvest> Harvests { get; set; }
    public DbSet<SoilRecord> SoilRecords { get; set; }

    // Component 4 - Reporting, Analytics & User Management
    public DbSet<User> Users { get; set; }
    public DbSet<Role> Roles { get; set; }
    public DbSet<UserRole> UserRoles { get; set; }
    public DbSet<AuditLog> AuditLogs { get; set; }

    // Component 3 - Inventory & Supply Chain Management
    public DbSet<InventoryItem> InventoryItems { get; set; }
    public DbSet<InventoryTransaction> InventoryTransactions { get; set; }
    public DbSet<Supplier> Suppliers { get; set; }
    public DbSet<SupplierItem> SupplierItems { get; set; }
    public DbSet<PurchaseRequest> PurchaseRequests { get; set; }
    public DbSet<ReorderRecommendation> ReorderRecommendations { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // --- Component 1 relationships ---
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
            .HasOne(sr => sr.Field)
            .WithMany(f => f.SoilRecords)
            .HasForeignKey(sr => sr.FieldId)
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

        // --- Component 3 / Inventory relationships & constraints ---
        modelBuilder.Entity<ReorderRecommendation>(entity =>
        {
            entity.HasOne<InventoryItem>().WithMany().HasForeignKey(r => r.InventoryItemId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne<Supplier>().WithMany().HasForeignKey(r => r.SupplierId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(r => r.PurchaseRequest).WithOne().HasForeignKey<ReorderRecommendation>(r => r.PurchaseRequestId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasIndex(r => new { r.AgentRunId, r.InventoryItemId }).IsUnique();
            entity.HasIndex(r => r.InventoryItemId).IsUnique().HasFilter("\"Status\" = 'Pending'");
            entity.Property(r => r.Model).HasMaxLength(100);
            entity.Property(r => r.ProposedBy).HasMaxLength(200);
            entity.Property(r => r.ProposedByIssuer).HasMaxLength(500);
            entity.Property(r => r.DecidedBy).HasMaxLength(200);
            entity.Property(r => r.DecidedByIssuer).HasMaxLength(500);
            entity.Property(r => r.Reason).HasMaxLength(500);
            entity.Property(r => r.DecisionNote).HasMaxLength(500);
            entity.Property(r => r.Status).HasMaxLength(20);
            entity.Property(r => r.UnitOfMeasurement).HasMaxLength(30);
            entity.Property(r => r.RecommendedQuantity).HasPrecision(10, 2);
            entity.Property(r => r.StockAtProposal).HasPrecision(10, 2);
            entity.Property(r => r.MinimumStockAtProposal).HasPrecision(10, 2);
            entity.Property(r => r.UnitPrice).HasPrecision(10, 2);
        });

        modelBuilder.Entity<SupplierItem>()
            .HasIndex(si => new { si.SupplierId, si.InventoryItemId })
            .IsUnique();

        modelBuilder.Entity<InventoryTransaction>()
            .HasOne(t => t.InventoryItem)
            .WithMany(i => i.InventoryTransactions)
            .HasForeignKey(t => t.InventoryItemId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<SupplierItem>()
            .HasOne(si => si.Supplier)
            .WithMany(s => s.SupplierItems)
            .HasForeignKey(si => si.SupplierId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<SupplierItem>()
            .HasOne(si => si.InventoryItem)
            .WithMany(i => i.SupplierItems)
            .HasForeignKey(si => si.InventoryItemId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<PurchaseRequest>()
            .HasOne(pr => pr.InventoryItem)
            .WithMany(i => i.PurchaseRequests)
            .HasForeignKey(pr => pr.InventoryItemId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<PurchaseRequest>()
            .HasOne(pr => pr.Supplier)
            .WithMany(s => s.PurchaseRequests)
            .HasForeignKey(pr => pr.SupplierId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<InventoryItem>(entity =>
        {
            entity.Property(i => i.Name).HasMaxLength(100);
            entity.Property(i => i.Category).HasMaxLength(50);
            entity.Property(i => i.UnitOfMeasurement).HasMaxLength(30);
            entity.Property(i => i.CurrentStock).HasPrecision(10, 2);
            entity.Property(i => i.MinimumStockLevel).HasPrecision(10, 2);
            entity.Property(i => i.UnitCost).HasPrecision(10, 2);
        });

        modelBuilder.Entity<InventoryTransaction>(entity =>
        {
            entity.Property(t => t.TransactionType).HasMaxLength(50);
            entity.Property(t => t.Quantity).HasPrecision(10, 2);
            entity.Property(t => t.Notes).HasMaxLength(500);
        });

        modelBuilder.Entity<Supplier>(entity =>
        {
            entity.Property(s => s.Name).HasMaxLength(100);
            entity.Property(s => s.ContactPerson).HasMaxLength(100);
            entity.Property(s => s.Phone).HasMaxLength(20);
            entity.Property(s => s.Email).HasMaxLength(150);
            entity.Property(s => s.Address).HasMaxLength(250);
        });

        modelBuilder.Entity<SupplierItem>(entity =>
        {
            entity.Property(si => si.UnitPrice).HasPrecision(10, 2);
        });

        modelBuilder.Entity<PurchaseRequest>(entity =>
        {
            entity.Property(pr => pr.RequestedQuantity).HasPrecision(10, 2);
            entity.Property(pr => pr.Reason).HasMaxLength(500);
            entity.Property(pr => pr.Status).HasMaxLength(50);
        });
    }
}