namespace AgriOpsAI.Api.DTOs;

public class CreateFieldDto
{
    public Guid FarmId { get; set; }
    public string FieldName { get; set; } = string.Empty;
    public decimal AreaSize { get; set; }
    public string SoilType { get; set; } = string.Empty;
    public string? BoundaryCoordinates { get; set; }
}

public class UpdateFieldDto
{
    public string FieldName { get; set; } = string.Empty;
    public decimal AreaSize { get; set; }
    public string SoilType { get; set; } = string.Empty;
    public string? BoundaryCoordinates { get; set; }
}

public class FieldDto
{
    public Guid Id { get; set; }
    public Guid FarmId { get; set; }
    public string FieldName { get; set; } = string.Empty;
    public decimal AreaSize { get; set; }
    public string SoilType { get; set; } = string.Empty;
    public string? BoundaryCoordinates { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}