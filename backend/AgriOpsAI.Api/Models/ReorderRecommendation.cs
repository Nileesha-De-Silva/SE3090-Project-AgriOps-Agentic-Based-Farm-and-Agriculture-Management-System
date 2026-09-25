namespace AgriOpsAI.Api.Models;

public class ReorderRecommendation
{
    public Guid Id { get; set; }
    public Guid AgentRunId { get; set; }
    public string Model { get; set; } = string.Empty;
    public string ProposedBy { get; set; } = string.Empty;
    public string ProposedByIssuer { get; set; } = string.Empty;
    public Guid InventoryItemId { get; set; }
    public Guid SupplierId { get; set; }
    public decimal RecommendedQuantity { get; set; }
    public string Reason { get; set; } = string.Empty;
    public decimal StockAtProposal { get; set; }
    public decimal MinimumStockAtProposal { get; set; }
    public string UnitOfMeasurement { get; set; } = string.Empty;
    public decimal UnitPrice { get; set; }
    public int LeadTimeDays { get; set; }
    public string Status { get; set; } = "Pending";
    public DateTime CreatedAt { get; set; }
    public DateTime? DecidedAt { get; set; }
    public string? DecidedBy { get; set; }
    public string? DecidedByIssuer { get; set; }
    public string? DecisionNote { get; set; }
    public Guid? PurchaseRequestId { get; set; }
    public PurchaseRequest? PurchaseRequest { get; set; }
}
