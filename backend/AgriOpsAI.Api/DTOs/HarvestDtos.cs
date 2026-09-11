namespace AgriOpsAI.Api.DTOs;

public class CreateHarvestDto
{
    public DateTime HarvestDate { get; set; }
    public decimal YieldAmount { get; set; }
    public string? QualityGrade { get; set; }
    public Guid RecordedByUserId { get; set; }
}

public class UpdateHarvestDto
{
    public DateTime HarvestDate { get; set; }
    public decimal YieldAmount { get; set; }
    public string? QualityGrade { get; set; }
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