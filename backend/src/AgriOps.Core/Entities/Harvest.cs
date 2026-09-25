using System;

namespace AgriOps.Core.Entities;

public class Harvest
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid CropSeasonId { get; set; }
    public DateTime HarvestDate { get; set; }
    public decimal YieldAmount { get; set; }
    public string? QualityGrade { get; set; }
    public Guid RecordedByUserId { get; set; }

    public CropSeason? CropSeason { get; set; } = null!;
}
