namespace AgriOpsAI.Api.DTOs;

public class PurchaseRequestDto
{
    public Guid Id { get; set; }
    public Guid InventoryItemId { get; set; }
    public Guid SupplierId { get; set; }
    public decimal RequestedQuantity { get; set; }
    public string Reason { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime RequestedAt { get; set; }
    public DateTime? ApprovedAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
