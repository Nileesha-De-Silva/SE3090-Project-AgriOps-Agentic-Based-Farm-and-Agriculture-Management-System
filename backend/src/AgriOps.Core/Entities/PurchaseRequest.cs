namespace AgriOpsAI.Api.Models;

public class PurchaseRequest
{
    public Guid Id { get; set; }

    public Guid InventoryItemId { get; set; }

    public Guid SupplierId { get; set; }

    public decimal RequestedQuantity { get; set; }

    public string Reason { get; set; } = string.Empty;

    public string Status { get; set; } = string.Empty;

    public DateTime RequestedAt { get; set; } = DateTime.UtcNow;

    public DateTime? ApprovedAt { get; set; } //a newly created request hasn't necessarily been approved yet

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public InventoryItem InventoryItem { get; set; } = null!;

    public Supplier Supplier { get; set; } = null!;

    
}