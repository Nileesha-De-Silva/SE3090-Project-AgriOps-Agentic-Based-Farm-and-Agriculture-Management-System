namespace AgriOpsAI.Api.Models;

public class InventoryItem
{
    public Guid Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public string Category { get; set; } = string.Empty;

    public string UnitOfMeasurement { get; set; } = string.Empty;

    public decimal CurrentStock { get; set; }

    public decimal MinimumStockLevel { get; set; }

    public decimal UnitCost { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // relationships
    public ICollection<InventoryTransaction> InventoryTransactions { get; set; }
    = new List<InventoryTransaction>();

    public ICollection<SupplierItem> SupplierItems { get; set; }
    = new List<SupplierItem>();

    public ICollection<PurchaseRequest> PurchaseRequests { get; set; }
    = new List<PurchaseRequest>();
    
}