using System.ComponentModel.DataAnnotations;

namespace AgriOpsAI.Api.DTOs;

public class CreateInventoryTransactionDto
{
    [Required]
    [RegularExpression(
      "^(Receive|Use)$",
      ErrorMessage = "Transaction type must be Recieve or Use."
    )]
    public string TransactionType {get; set;} = string.Empty;

    [Required]
    [Range(
      typeof(decimal),
      "0.01",
      "99999999.99",
      ErrorMessage = "Quantitymust be between 0.01 and 99999999.99."
    )]

    public decimal? Quantity {get; set;}

    [StringLength(500)]
    public string? Notes {get; set; }

}

public class InventoryTransactionDto
{
    public Guid Id { get; set; }
    
    public Guid InventoryItemId { get; set; }

    public string TransactionType { get; set; } = string.Empty;

    public decimal Quantity { get; set; }

    public DateTime TransactionDate { get; set; }

    public string? Notes { get; set; }

    public DateTime CreatedAt { get; set; }

}