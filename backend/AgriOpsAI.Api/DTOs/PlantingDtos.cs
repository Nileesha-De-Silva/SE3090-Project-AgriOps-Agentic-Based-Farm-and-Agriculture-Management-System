using System.ComponentModel.DataAnnotations;

namespace AgriOpsAI.Api.DTOs;

public class CreatePlantingDto
{
    [Required]
    public DateTime PlantingDate { get; set; }

    [Range(0.01, double.MaxValue, ErrorMessage = "InitialQuantity must be greater than 0.")]
    public decimal InitialQuantity { get; set; }

    [MaxLength(100)]
    public string? PlantingMethod { get; set; }

    [MaxLength(1000)]
    public string? Notes { get; set; }
}

public class PlantingDto
{
    public Guid Id { get; set; }
    public Guid CropSeasonId { get; set; }
    public DateTime PlantingDate { get; set; }
    public decimal InitialQuantity { get; set; }
    public string? PlantingMethod { get; set; }
    public string? Notes { get; set; }
}