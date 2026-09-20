namespace AgriOpsAI.Api.Models;

public class Supplier
{
    public Guid Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public string? ContactPerson { get; set; } // optional/null allowed

    public string? Phone { get; set; }

    public string? Email { get; set; }

    public string? Address { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // relationships
    public ICollection<SupplierItem> SupplierItems { get; set; }
    = new List<SupplierItem>();

    public ICollection<PurchaseRequest> PurchaseRequests { get; set; }
    = new List<PurchaseRequest>();

}