namespace AgriOpsAI.Api.Models;

public class SupplierItem
{
    public Guid Id { get; set; }

    public Guid SupplierId { get; set; }

    public Guid InventoryItemId { get; set; }

    public decimal UnitPrice { get; set; }

    public int LeadTimeDays { get; set; }

    public bool IsAvailable { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public Supplier Supplier { get; set; } = null!;

    public InventoryItem InventoryItem { get; set; } = null!;
}