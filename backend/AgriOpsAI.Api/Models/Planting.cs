namespace AgriOpsAI.Api.Models;

public class Planting
{
    public Guid Id{get;set;}
    public Guid CropSeasonId {get;set;}
    public DateTime PlantingDate {get;set;}
    public decimal InitialQuantity {get;set;}
    public string? PlantingMethod {get;set;}
    public string? Notes {get;set;}

}