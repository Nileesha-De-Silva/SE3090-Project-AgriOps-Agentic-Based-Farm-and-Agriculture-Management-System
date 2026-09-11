using System.ComponentModel.DataAnnotations;

namespace AgriOpsAI.Api.DTOs;

public class CreateSoilRecordDto
{
    [Required]
    public DateTime TestDate { get; set; }

    [Range(0, 14, ErrorMessage = "PhLevel must be between 0 and 14.")]
    public decimal PhLevel { get; set; }

    [Range(0, double.MaxValue)]
    public decimal NitrogenLevel { get; set; }

    [Range(0, double.MaxValue)]
    public decimal PhosphorusLevel { get; set; }

    [Range(0, double.MaxValue)]
    public decimal PotassiumLevel { get; set; }

    [MaxLength(1000)]
    public string? Notes { get; set; }
}

public class SoilRecordDto
{
    public Guid Id { get; set; }
    public Guid FieldId { get; set; }
    public DateTime TestDate { get; set; }
    public decimal PhLevel { get; set; }
    public decimal NitrogenLevel { get; set; }
    public decimal PhosphorusLevel { get; set; }
    public decimal PotassiumLevel { get; set; }
    public string? Notes { get; set; }
}