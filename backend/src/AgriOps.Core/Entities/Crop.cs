using System;
using System.Collections.Generic;

namespace AgriOps.Core.Entities;

public class Crop
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string CropName { get; set; } = string.Empty;
    public string Variety { get; set; } = string.Empty;
    public int OptimalGrowthDurationDays { get; set; }
    public string? Description { get; set; }

    public ICollection<CropSeason> CropSeasons { get; set; } = new List<CropSeason>();
}
