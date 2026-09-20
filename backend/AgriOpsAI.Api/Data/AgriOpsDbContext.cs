using Microsoft.EntityFrameworkCore;
using AgriOpsAI.Api.Models;

namespace AgriOpsAI.Api.Data;

public class AgriOpsDbContext : DbContext
{
    public AgriOpsDbContext(DbContextOptions<AgriOpsDbContext> options)
        : base(options)
    {
    }

    public DbSet<InventoryItem> InventoryItems { get; set; }
    public DbSet<InventoryTransaction> InventoryTransactions { get; set; }
    public DbSet<Supplier> Suppliers { get; set; }
    public DbSet<SupplierItem> SupplierItems { get; set; }
    public DbSet<PurchaseRequest> PurchaseRequests { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
{ 
    base.OnModelCreating(modelBuilder);

    modelBuilder.Entity<SupplierItem>()
        .HasIndex(si => new { si.SupplierId, si.InventoryItemId })
        .IsUnique(); //unique index prevents that duplicate supplier-item relationship.

    modelBuilder.Entity<InventoryTransaction>()
    .HasOne(t => t.InventoryItem)
    .WithMany(i => i.InventoryTransactions)
    .HasForeignKey(t => t.InventoryItemId)
    .OnDelete(DeleteBehavior.Restrict);
    
    modelBuilder.Entity<SupplierItem>()
    .HasOne(si => si.Supplier)
    .WithMany(s => s.SupplierItems)
    .HasForeignKey(si => si.SupplierId)
    .OnDelete(DeleteBehavior.Restrict); // Prevent deleting a supplier if related supplier-item records exist
    
    modelBuilder.Entity<SupplierItem>()
    .HasOne(si => si.InventoryItem)
    .WithMany(i => i.SupplierItems)
    .HasForeignKey(si => si.InventoryItemId)
    .OnDelete(DeleteBehavior.Restrict);      // Prevent deleting an inventory item if related supplier-item records exist

    modelBuilder.Entity<PurchaseRequest>()
    .HasOne(pr => pr.InventoryItem)
    .WithMany(i => i.PurchaseRequests)
    .HasForeignKey(pr => pr.InventoryItemId)
    .OnDelete(DeleteBehavior.Restrict);     // Preserve purchase request history when an inventory item is referenced

    modelBuilder.Entity<PurchaseRequest>()
    .HasOne(pr => pr.Supplier)
    .WithMany(s => s.PurchaseRequests)
    .HasForeignKey(pr => pr.SupplierId)
    .OnDelete(DeleteBehavior.Restrict);    // Preserve purchase request history when a supplier is referenced

    
        modelBuilder.Entity<InventoryItem>(entity =>
    {
        entity.Property(i => i.Name)
            .HasMaxLength(100);

        entity.Property(i => i.Category)
            .HasMaxLength(50);

        entity.Property(i => i.UnitOfMeasurement)
            .HasMaxLength(30);

        entity.Property(i => i.CurrentStock)
            .HasPrecision(10, 2);

        entity.Property(i => i.MinimumStockLevel)
            .HasPrecision(10, 2);

        entity.Property(i => i.UnitCost)
            .HasPrecision(10, 2);
    });


        modelBuilder.Entity<InventoryTransaction>(entity =>
    {
        entity.Property(t => t.TransactionType)
            .HasMaxLength(50);

        entity.Property(t => t.Quantity)
            .HasPrecision(10, 2);

        entity.Property(t => t.Notes)
            .HasMaxLength(500);
    });


    
    // Configure maximum lengths for supplier details
        modelBuilder.Entity<Supplier>(entity =>
    {
        entity.Property(s => s.Name)
            .HasMaxLength(100);

        entity.Property(s => s.ContactPerson)
            .HasMaxLength(100);

        entity.Property(s => s.Phone)
            .HasMaxLength(20);

        entity.Property(s => s.Email)
            .HasMaxLength(150);

        entity.Property(s => s.Address)
            .HasMaxLength(250);
    });

    // Configure supplier-item pricing constraints
        modelBuilder.Entity<SupplierItem>(entity =>
    {
        entity.Property(si => si.UnitPrice)
            .HasPrecision(10, 2);
    });
    

    // Configure purchase request constraints
    modelBuilder.Entity<PurchaseRequest>(entity =>
{
    entity.Property(pr => pr.RequestedQuantity)
        .HasPrecision(10, 2);

    entity.Property(pr => pr.Reason)
        .HasMaxLength(500);

    entity.Property(pr => pr.Status)
        .HasMaxLength(50);
});


  } 

    

}