using System.ComponentModel.DataAnnotations;

namespace AgriOpsAI.Api.DTOs;

public class CreateFieldDto
{
    [Required]
    public Guid FarmId { get; set; }

    [Required, MaxLength(200)]
    public string FieldName { get; set; } = string.Empty;

    [Range(0.01, double.MaxValue, ErrorMessage = "AreaSize must be greater than 0.")]
    public decimal AreaSize { get; set; }

    [Required, MaxLength(100)]
    public string SoilType { get; set; } = string.Empty;

    public string? BoundaryCoordinates { get; set; }
}

public class UpdateFieldDto
{
    [Required, MaxLength(200)]
    public string FieldName { get; set; } = string.Empty;

    [Range(0.01, double.MaxValue, ErrorMessage = "AreaSize must be greater than 0.")]
    public decimal AreaSize { get; set; }

    [Required, MaxLength(100)]
    public string SoilType { get; set; } = string.Empty;

    public string? BoundaryCoordinates { get; set; }
}

public class FieldDto
{
    public Guid Id { get; set; }
    public Guid FarmId { get; set; }
    public string FieldName { get; set; } = string.Empty;
    public decimal AreaSize { get; set; }
    public string SoilType { get; set; } = string.Empty;
    public string? BoundaryCoordinates { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}