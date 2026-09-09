namespace AgriOpsAI.Api.Models;

public class Harvest
{
    public Guid Id{get;set;}
    public Guid CropSeasonId{get;set;}
    public DateTime HarvestDate {get;set;}
    public decimal YieldAmount {get;set;}
    public string? QualityGrade {get;set;}
    public Guid RecordedByUserId {get;set;}

    public CropSeason CropSeason {get;set;} = null!;

}