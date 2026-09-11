namespace AgriOpsAI.Api.DTOs;

public class CreateSoilRecordDto
{
    public DateTime TestDate { get; set; }
    public decimal PhLevel { get; set; }
    public decimal NitrogenLevel { get; set; }
    public decimal PhosphorusLevel { get; set; }
    public decimal PotassiumLevel { get; set; }
    public string? Notes { get; set; }
}

public class SoilRecordDto
{
    public Guid Id { get; set; }
    public Guid FieldId { get; set; }
    public DateTime TestDate { get; set; }
    public decimal PhLevel { get; set; }
    public decimal NitrogenLevel { get; set; }
    public decimal PhosphorusLevel { get; set; }
    public decimal PotassiumLevel { get; set; }
    public string? Notes { get; set; }
}