using System.ComponentModel.DataAnnotations;

namespace AgriOpsAI.Api.DTOs;

public class CreateReorderRecommendationDto
{
    [Required] public Guid? AgentRunId { get; set; }
    [Required, StringLength(100)] public string Model { get; set; } = string.Empty;
    [Required] public Guid? InventoryItemId { get; set; }
    [Required] public Guid? SupplierId { get; set; }
    [Required, Range(typeof(decimal), "0.01", "99999999.99")]
    public decimal? RecommendedQuantity { get; set; }
    [Required, StringLength(500)] public string Reason { get; set; } = string.Empty;
}

public class RecommendationDecisionDto
{
    [StringLength(500)] public string? Note { get; set; }
}

public class ReorderRecommendationDto
{
    public Guid Id { get; set; }
    public Guid AgentRunId { get; set; }
    public string Model { get; set; } = string.Empty;
    public Guid InventoryItemId { get; set; }
    public Guid SupplierId { get; set; }
    public decimal RecommendedQuantity { get; set; }
    public string Reason { get; set; } = string.Empty;
    public decimal StockAtProposal { get; set; }
    public decimal MinimumStockAtProposal { get; set; }
    public string UnitOfMeasurement { get; set; } = string.Empty;
    public decimal UnitPrice { get; set; }
    public int LeadTimeDays { get; set; }
    public decimal EstimatedCost { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime? DecidedAt { get; set; }
    public string? DecidedBy { get; set; }
    public string? DecidedByIssuer { get; set; }
    public string? DecisionNote { get; set; }
    public Guid? PurchaseRequestId { get; set; }
}
