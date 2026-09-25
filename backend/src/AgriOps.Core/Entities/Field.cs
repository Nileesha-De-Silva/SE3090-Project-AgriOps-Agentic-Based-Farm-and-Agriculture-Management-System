using System;
using System.Collections.Generic;

namespace AgriOps.Core.Entities;

public class Field
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid FarmId { get; set; }
    public string FieldName { get; set; } = string.Empty;
    public decimal AreaSize { get; set; }
    public string SoilType { get; set; } = string.Empty;
    public string? BoundaryCoordinates { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public Farm? Farm { get; set; } = null!;
    public ICollection<CropSeason> CropSeasons { get; set; } = new List<CropSeason>();
    public ICollection<SoilRecord> SoilRecords { get; set; } = new List<SoilRecord>();
}
