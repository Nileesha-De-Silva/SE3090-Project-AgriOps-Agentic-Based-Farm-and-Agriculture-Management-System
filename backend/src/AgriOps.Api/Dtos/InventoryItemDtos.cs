using System.ComponentModel.DataAnnotations;

namespace AgriOpsAI.Api.DTOs;

public class CreateInventoryItemDto
{
    [Required]
    [StringLength(100)]
    public string Name { get; set; } = string.Empty;

    [Required]
    [StringLength(50)]
    public string Category { get; set; } = string.Empty;

    [Required]
    [StringLength(30)]
    public string UnitOfMeasurement { get; set; } = string.Empty;

    [Required]
    [Range(typeof(decimal), "0", "99999999.99")]
    public decimal? MinimumStockLevel { get; set; }

    [Required]
    [Range(typeof(decimal), "0", "99999999.99")]
    public decimal? UnitCost { get; set; }
}

public class UpdateInventoryItemDto
{
    [Required]
    [StringLength(100)]
    public string Name { get; set; } = string.Empty;

    [Required]
    [StringLength(50)]
    public string Category { get; set; } = string.Empty;

    [Required]
    [StringLength(30)]
    public string UnitOfMeasurement { get; set; } = string.Empty;

    [Required]
    [Range(typeof(decimal), "0", "99999999.99")]
    public decimal? MinimumStockLevel { get; set; }

    [Required]
    [Range(typeof(decimal), "0", "99999999.99")]
    public decimal? UnitCost { get; set; }
}

public class InventoryItemDto
{
    public Guid Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public string Category { get; set; } = string.Empty;

    public string UnitOfMeasurement { get; set; } = string.Empty;

    public decimal CurrentStock { get; set; }

    public decimal MinimumStockLevel { get; set; }

    public decimal UnitCost { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }
}