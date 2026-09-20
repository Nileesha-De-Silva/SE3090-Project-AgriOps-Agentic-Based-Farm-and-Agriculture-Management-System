namespace AgriOpsAI.Api.Models;

public class InventoryTransaction
{
    public Guid Id { get; set; }

    public Guid InventoryItemId { get; set; } //  foreign key

    public string TransactionType { get; set; } = string.Empty;

    public decimal Quantity { get; set; }

    public DateTime TransactionDate { get; set; } = DateTime.UtcNow;

    public string? Notes { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public InventoryItem InventoryItem { get; set; } = null!; // navigation property
}
