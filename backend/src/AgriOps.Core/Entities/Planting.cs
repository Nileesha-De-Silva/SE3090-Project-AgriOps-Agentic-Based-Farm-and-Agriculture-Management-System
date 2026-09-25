using System;

namespace AgriOps.Core.Entities;

public class Planting
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid CropSeasonId { get; set; }
    public DateTime PlantingDate { get; set; }
    public decimal InitialQuantity { get; set; }
    public string? PlantingMethod { get; set; }
    public string? Notes { get; set; }

    public CropSeason? CropSeason { get; set; } = null!;
}
