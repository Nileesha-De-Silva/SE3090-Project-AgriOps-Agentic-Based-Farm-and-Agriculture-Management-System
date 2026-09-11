using System.ComponentModel.DataAnnotations;

namespace AgriOpsAI.Api.DTOs;

public class CreateCropDto
{
    [Required, MaxLength(150)]
    public string CropName { get; set; } = string.Empty;

    [Required, MaxLength(150)]
    public string Variety { get; set; } = string.Empty;

    [Range(1, 1000, ErrorMessage = "OptimalGrowthDurationDays must be between 1 and 1000.")]
    public int OptimalGrowthDurationDays { get; set; }

    [MaxLength(1000)]
    public string? Description { get; set; }
}

public class UpdateCropDto
{
    [Required, MaxLength(150)]
    public string CropName { get; set; } = string.Empty;

    [Required, MaxLength(150)]
    public string Variety { get; set; } = string.Empty;

    [Range(1, 1000, ErrorMessage = "OptimalGrowthDurationDays must be between 1 and 1000.")]
    public int OptimalGrowthDurationDays { get; set; }

    [MaxLength(1000)]
    public string? Description { get; set; }
}

public class CropDto
{
    public Guid Id { get; set; }
    public string CropName { get; set; } = string.Empty;
    public string Variety { get; set; } = string.Empty;
    public int OptimalGrowthDurationDays { get; set; }
    public string? Description { get; set; }
}