using Microsoft.EntityFrameworkCore;
using AgriOps.Core.Entities;
using AgriOpsAI.Api.Models;

namespace AgriOps.Infrastructure.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<FarmTask> Tasks => Set<FarmTask>();
    public DbSet<CropAnalysisAssessment> CropAnalysisAssessments => Set<CropAnalysisAssessment>();
    public DbSet<ApprovalItem> ApprovalItems => Set<ApprovalItem>();
    public DbSet<Worker> Workers => Set<Worker>();
    public DbSet<WorkerSkill> WorkerSkills => Set<WorkerSkill>();
    public DbSet<TaskAssignment> TaskAssignments => Set<TaskAssignment>();
    public DbSet<TaskSchedule> TaskSchedules => Set<TaskSchedule>();
    public DbSet<TaskHistory> TaskHistories => Set<TaskHistory>();

    // Component 1 Entities
    public DbSet<Farm> Farms => Set<Farm>();
    public DbSet<Field> Fields => Set<Field>();
    public DbSet<Crop> Crops => Set<Crop>();
    public DbSet<CropSeason> CropSeasons => Set<CropSeason>();
    public DbSet<Planting> Plantings => Set<Planting>();
    public DbSet<Harvest> Harvests => Set<Harvest>();
    public DbSet<SoilRecord> SoilRecords => Set<SoilRecord>();

    // Component 3 - Inventory & Supply Chain Management
    public DbSet<InventoryItem> InventoryItems => Set<InventoryItem>();
    public DbSet<InventoryTransaction> InventoryTransactions => Set<InventoryTransaction>();
    public DbSet<Supplier> Suppliers => Set<Supplier>();
    public DbSet<SupplierItem> SupplierItems => Set<SupplierItem>();
    public DbSet<PurchaseRequest> PurchaseRequests => Set<PurchaseRequest>();
    public DbSet<ReorderRecommendation> ReorderRecommendations => Set<ReorderRecommendation>();

    // Component 4 - Reporting, Analytics, Auth & Audit
    public DbSet<User> Users => Set<User>();
    public DbSet<Role> Roles => Set<Role>();
    public DbSet<UserRole> UserRoles => Set<UserRole>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // FarmTask Configuration
        modelBuilder.Entity<FarmTask>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Title).HasMaxLength(200);
            entity.Property(e => e.TaskType).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Priority).IsRequired().HasMaxLength(50);
            entity.Property(e => e.Status).IsRequired().HasMaxLength(50);
            entity.Property(e => e.Description).HasMaxLength(1000);
            entity.HasIndex(e => e.FieldId);
            entity.HasIndex(e => e.Status);
        });

        // Worker Configuration
        modelBuilder.Entity<Worker>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.FullName).IsRequired().HasMaxLength(200);
            entity.Property(e => e.ContactNumber).HasMaxLength(50);
            entity.Property(e => e.EmploymentType).IsRequired().HasMaxLength(50);
            entity.Property(e => e.Status).IsRequired().HasMaxLength(50);
            entity.HasIndex(e => e.UserId);
        });

        // WorkerSkill Configuration
        modelBuilder.Entity<WorkerSkill>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.SkillName).IsRequired().HasMaxLength(100);
            entity.Property(e => e.ProficiencyLevel).IsRequired().HasMaxLength(50);

            entity.HasOne(e => e.Worker)
                .WithMany(w => w.Skills)
                .HasForeignKey(e => e.WorkerId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // TaskAssignment Configuration
        modelBuilder.Entity<TaskAssignment>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Status).IsRequired().HasMaxLength(50);

            entity.HasOne(e => e.Task)
                .WithMany(t => t.Assignments)
                .HasForeignKey(e => e.TaskId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Worker)
                .WithMany(w => w.TaskAssignments)
                .HasForeignKey(e => e.WorkerId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // TaskHistory Configuration
        modelBuilder.Entity<TaskHistory>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.PreviousStatus).HasMaxLength(50);
            entity.Property(e => e.NewStatus).IsRequired().HasMaxLength(50);

            entity.HasOne(e => e.Task)
                .WithMany(t => t.Histories)
                .HasForeignKey(e => e.TaskId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // TaskSchedule Configuration
        modelBuilder.Entity<TaskSchedule>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Frequency).IsRequired().HasMaxLength(50);

            entity.HasOne(e => e.Task)
                .WithOne(t => t.Schedule)
                .HasForeignKey<TaskSchedule>(s => s.TaskId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // CropAnalysisAssessment Configuration
        modelBuilder.Entity<CropAnalysisAssessment>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.CropVariety).IsRequired().HasMaxLength(100);
            entity.Property(e => e.GrowthStage).HasMaxLength(100);
            entity.Property(e => e.RiskLevel).IsRequired().HasMaxLength(50);
            entity.Property(e => e.Status).IsRequired().HasMaxLength(50);
            entity.HasIndex(e => e.FieldId);
            entity.HasIndex(e => e.WorkflowId);
        });

        // ApprovalItem Configuration
        modelBuilder.Entity<ApprovalItem>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.ActionDescription).IsRequired().HasMaxLength(500);
            entity.Property(e => e.ProposedTaskType).HasMaxLength(100);
            entity.Property(e => e.Status).IsRequired().HasMaxLength(50);
            entity.HasIndex(e => e.WorkflowId);
        });

        // Component 1 Relationships & Configurations
        modelBuilder.Entity<Field>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(f => f.Farm)
                .WithMany(farm => farm.Fields)
                .HasForeignKey(f => f.FarmId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<CropSeason>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(cs => cs.Field)
                .WithMany(f => f.CropSeasons)
                .HasForeignKey(cs => cs.FieldId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(cs => cs.Crop)
                .WithMany(c => c.CropSeasons)
                .HasForeignKey(cs => cs.CropId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<SoilRecord>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(sr => sr.Field)
                .WithMany(f => f.SoilRecords)
                .HasForeignKey(sr => sr.FieldId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Planting>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(p => p.CropSeason)
                .WithMany(cs => cs.Plantings)
                .HasForeignKey(p => p.CropSeasonId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Harvest>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(h => h.CropSeason)
                .WithMany(cs => cs.Harvests)
                .HasForeignKey(h => h.CropSeasonId)
                .OnDelete(DeleteBehavior.Cascade);
        });

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
