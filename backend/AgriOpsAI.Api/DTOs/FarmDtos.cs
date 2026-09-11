namespace AgriOpsAI.Api.DTOs;

public class CreateFarmDto
{
    public string Name { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
    public decimal TotalArea { get; set; }
    public Guid OwnerId { get; set; }
}

public class UpdateFarmDto
{
    public string Name { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
    public decimal TotalArea { get; set; }
}

public class FarmDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
    public decimal TotalArea { get; set; }
    public Guid OwnerId { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}