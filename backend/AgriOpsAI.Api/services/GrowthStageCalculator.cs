using AgriOpsAI.Api.Models;

namespace AgriOpsAI.Api.Services;

public static class GrowthStageCalculator
{
    public static GrowthStage Calculate(DateTime? plantingDate, int optimalGrowthDurationDays)
    {
        if (plantingDate == null) return GrowthStage.NotPlanted;

        var daysElapsed = (DateTime.UtcNow - plantingDate.Value).TotalDays;

        if (daysElapsed < 0) return GrowthStage.NotPlanted;
        if (optimalGrowthDurationDays <= 0) return GrowthStage.NotPlanted;

        var percentComplete = daysElapsed / optimalGrowthDurationDays;

        return percentComplete switch
        {
            >= 1.0 => GrowthStage.PastHarvest,
            >= 0.85 => GrowthStage.Harvesting,
            >= 0.60 => GrowthStage.Fruiting,
            >= 0.30 => GrowthStage.Flowering,
            >= 0.10 => GrowthStage.Vegetative,
            _ => GrowthStage.Germination
        };
    }
}