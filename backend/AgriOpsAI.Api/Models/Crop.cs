namespace AgriOpsAI.Api.Models;

public class Crop
{
    public Guid Id{get;set;}
    public string CropName {get;set;} = string.Empty;
    public string Variety {get; set;} = string.Empty;
    public int OptimalGrowthDurationDays {get; set;}
    public string? Description {get;set;}

    public ICollection<CropSeason> CropSeasons {get;set;} = new List<CropSeason>();

}