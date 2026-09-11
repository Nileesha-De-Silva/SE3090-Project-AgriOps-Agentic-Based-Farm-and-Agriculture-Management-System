using AgriOpsAI.Api.Models;

namespace AgriOpsAI.Api.DTOs;

public class CreateCropSeasonDto
{
    public Guid FieldId { get; set; }
    public Guid CropId { get; set; }
    public string SeasonName { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public DateTime TargetEndDate { get; set; }
    public CropSeasonStatus Status { get; set; } = CropSeasonStatus.planned;
}

public class UpdateCropSeasonDto
{
    public string SeasonName { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public DateTime TargetEndDate { get; set; }
    public CropSeasonStatus Status { get; set; }
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
}