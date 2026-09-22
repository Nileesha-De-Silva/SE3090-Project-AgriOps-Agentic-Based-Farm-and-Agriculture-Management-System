using System.ComponentModel.DataAnnotations;

namespace AgriOpsAI.Api.DTOs;

public class CreateHarvestDto
{
    [Required]
    public DateTime HarvestDate { get; set; }

    [Range(0.01, double.MaxValue, ErrorMessage = "YieldAmount must be greater than 0.")]
    public decimal YieldAmount { get; set; }

    [MaxLength(50)]
    public string? QualityGrade { get; set; }

    [Required]
    public Guid RecordedByUserId { get; set; }
}

public class UpdateHarvestDto
{
    [Required]
    public DateTime HarvestDate { get; set; }

    [Range(0.01, double.MaxValue, ErrorMessage = "YieldAmount must be greater than 0.")]
    public decimal YieldAmount { get; set; }

    [MaxLength(50)]
    public string? QualityGrade { get; set; }

    [Required]
    public Guid RecordedByUserId { get; set; }
}

public class HarvestDto
{
    public Guid Id { get; set; }
    public Guid CropSeasonId { get; set; }
    public DateTime HarvestDate { get; set; }
    public decimal YieldAmount { get; set; }
    public string? QualityGrade { get; set; }
    public Guid RecordedByUserId { get; set; }
}