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
    public ReorderObservationDto? Observation { get; set; }
    public DemandRequestDto? Demand { get; set; }
}

public class DemandRequestDto
{
    [Range(0, 90)] public int SafetyDays { get; set; } = 7;
    [Range(typeof(decimal), "0.01", "99999999.99")] public decimal? WeeklyEstimate { get; set; }
    public DateTime AsOf { get; set; }
    [Required, Range(typeof(decimal), "0", "79228162514264337593543950335")]
    public decimal? ObservedUsageLast28Days { get; set; }
}

public class DemandPlanDto
{
    public DateTime AsOf { get; set; }
    public decimal UsageLast28Days { get; set; }
    public decimal IncomingQuantity { get; set; }
    public decimal? WeeklyEstimate { get; set; }
    public int SafetyDays { get; set; }
    public string Source { get; set; } = string.Empty;
    public decimal AverageWeeklyUsage { get; set; }
    public decimal MonthlyUsage { get; set; }
    public decimal SafetyStock { get; set; }
    public decimal ReorderPoint { get; set; }
    public decimal TargetStock { get; set; }
    public decimal Quantity { get; set; }
    public bool ReorderNeeded { get; set; }
    public bool ShortageRisk { get; set; }
}

public class ReorderObservationDto
{
    [Required] public decimal? CurrentStock { get; set; }
    [Required] public decimal? MinimumStockLevel { get; set; }
    [Required] public decimal? UnitPrice { get; set; }
    [Required] public int? LeadTimeDays { get; set; }
    [Required] public decimal? IncomingQuantity { get; set; }
    [Required, StringLength(30)] public string UnitOfMeasurement { get; set; } = string.Empty;
}

public class RecommendationDecisionDto
{
    [StringLength(500)] public string? Note { get; set; }
}

public class ReorderRecommendationDto
{
    public DemandPlanDto? Demand { get; set; }
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
