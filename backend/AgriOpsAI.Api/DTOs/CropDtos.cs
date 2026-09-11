namespace AgriOpsAI.Api.DTOs;

public class CreateCropDto
{
    public string CropName { get; set; } = string.Empty;
    public string Variety { get; set; } = string.Empty;
    public int OptimalGrowthDurationDays { get; set; }
    public string? Description { get; set; }
}

public class UpdateCropDto
{
    public string CropName { get; set; } = string.Empty;
    public string Variety { get; set; } = string.Empty;
    public int OptimalGrowthDurationDays { get; set; }
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