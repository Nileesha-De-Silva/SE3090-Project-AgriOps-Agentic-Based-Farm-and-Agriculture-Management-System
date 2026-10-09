using System.ComponentModel.DataAnnotations;

namespace AgriOpsAI.Api.DTOs;

public class SaveSupplierItemDto
{
    [Required, Range(typeof(decimal), "0", "99999999.99")]
    public decimal? UnitPrice { get; set; }

    [Required, Range(0, int.MaxValue)]
    public int? LeadTimeDays { get; set; }

    [Required]
    public bool? IsAvailable { get; set; }
}

public class SupplierItemDto
{
    public Guid Id { get; set; }
    public Guid SupplierId { get; set; }
    public Guid InventoryItemId { get; set; }
    public decimal UnitPrice { get; set; }
    public int LeadTimeDays { get; set; }
    public bool IsAvailable { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
