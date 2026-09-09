namespace AgriOpsAI.Api.Models;

public enum CropSeasonStatus {planned, Active, Harvested, Closed}

public class CropSeason
{
    public Guid Id{get;set;}
    public Guid FieldId{get;set;}
    public Guid CropId{get;set;}
    public string SeasonName {get;set;} = string.Empty;
    public DateTime StartDate {get;set;} 
    public DateTime TargetEndDate {get;set;}
    public CropSeasonStatus Status {get;set;} = CropSeasonStatus.planned;

    public Field Field {get;set;} = null!;
    public Crop Crop {get;set;} = null!;
    public ICollection<Planting> Plantings {get;set;} = new List<Planting>();
    public ICollection<Harvest> Harvests {get;set;} = new List<Harvest>(); 
}