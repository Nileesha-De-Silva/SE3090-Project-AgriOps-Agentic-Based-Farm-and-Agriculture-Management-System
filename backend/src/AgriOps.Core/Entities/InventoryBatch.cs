namespace AgriOpsAI.Api.Models;

public class InventoryBatch
{
    public Guid Id { get; set; }
    public Guid InventoryItemId { get; set; }
    public Guid? PurchaseRequestId { get; set; }
    public Guid? SupplierId { get; set; }
    public string? BatchNumber { get; set; }
    public string? ShelfLocation { get; set; }
    public DateOnly? ExpirationDate { get; set; }
    public decimal ReceivedQuantity { get; set; }
    public decimal RemainingQuantity { get; set; }
    public DateTime ReceivedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public bool IsLegacy { get; set; }
}

public class InventoryBatchMovement
{
    public Guid Id { get; set; }
    public Guid InventoryBatchId { get; set; }
    public Guid InventoryTransactionId { get; set; }
    public decimal Quantity { get; set; }
}
