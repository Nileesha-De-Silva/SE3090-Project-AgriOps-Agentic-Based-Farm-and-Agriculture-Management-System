using System.ComponentModel.DataAnnotations;
using AgriOpsAI.Api.Models;

namespace AgriOpsAI.Api.DTOs;

public class CreateCropSeasonDto : IValidatableObject
{
    [Required]
    public Guid FieldId { get; set; }

    [Required]
    public Guid CropId { get; set; }

    [Required, MaxLength(150)]
    public string SeasonName { get; set; } = string.Empty;

    [Required]
    public DateTime StartDate { get; set; }

    [Required]
    public DateTime TargetEndDate { get; set; }

    public CropSeasonStatus Status { get; set; } = CropSeasonStatus.planned;

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (TargetEndDate <= StartDate)
        {
            yield return new ValidationResult(
                "TargetEndDate must be after StartDate.",
                new[] { nameof(TargetEndDate) });
        }
    }
}

public class UpdateCropSeasonDto : IValidatableObject
{
    [Required, MaxLength(150)]
    public string SeasonName { get; set; } = string.Empty;

    [Required]
    public DateTime StartDate { get; set; }

    [Required]
    public DateTime TargetEndDate { get; set; }

    public CropSeasonStatus Status { get; set; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (TargetEndDate <= StartDate)
        {
            yield return new ValidationResult(
                "TargetEndDate must be after StartDate.",
                new[] { nameof(TargetEndDate) });
        }
    }
}

public class CropSeasonDto
{
    public Guid Id { get; set; }
    public Guid FieldId { get; set; }
    public Guid CropId { get; set; }
    public string SeasonName { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public DateTime TargetEndDate { get; set; }
    public CropSeasonStatus Status { get; set; }
    public GrowthStage CurrentGrowthStage { get; set; }
}