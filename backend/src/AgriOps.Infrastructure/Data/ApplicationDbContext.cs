using Microsoft.EntityFrameworkCore;
using AgriOps.Core.Entities;

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

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // FarmTask Configuration
        modelBuilder.Entity<FarmTask>(entity =>
        {
            entity.HasKey(e => e.Id);
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
    }
}
