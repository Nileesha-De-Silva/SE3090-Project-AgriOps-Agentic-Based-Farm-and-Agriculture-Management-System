namespace AgriOpsAI.Api.Models;

public class Farm
{
    public Guid Id{ get; set;}
    public string Name{ get; set;} = string.Empty;
    public string Location{ get; set;} = string.Empty;
    public decimal TotalArea {get; set;}
    public Guid OwnerId {get; set;}
    public DateTime CreatedAt {get; set;} = DateTime.UtcNow;
    public DateTime UpdatedAt {get; set;} = DateTime.UtcNow;

    public ICollection<Field> Fields {get; set;} = new List<Field>();
}