using System.ComponentModel.DataAnnotations;

namespace AgriOpsAI.Api.DTOs;

public class CreateFarmDto
{
    [Required, MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [Required, MaxLength(200)]
    public string Location { get; set; } = string.Empty;

    [Range(0.01, double.MaxValue, ErrorMessage = "TotalArea must be greater than 0.")]
    public decimal TotalArea { get; set; }

    [Required]
    public Guid OwnerId { get; set; }
}

public class UpdateFarmDto
{
    [Required, MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [Required, MaxLength(200)]
    public string Location { get; set; } = string.Empty;

    [Range(0.01, double.MaxValue, ErrorMessage = "TotalArea must be greater than 0.")]
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