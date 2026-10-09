using System;
using AgriOps.Core.Entities;
using AgriOps.Core.Services;
using Xunit;

namespace AgriOps.Tests.Component1.Domain;

public class GrowthStageCalculatorTests
{
    [Fact]
    public void Calculate_WhenPlantingDateIsNull_ReturnsNotPlanted()
    {
        var result = GrowthStageCalculator.Calculate(null, 90);
        Assert.Equal(GrowthStage.NotPlanted, result);
    }

    [Fact]
    public void Calculate_WhenPlantingDateIsInFuture_ReturnsNotPlanted()
    {
        var futureDate = DateTime.UtcNow.AddDays(5);
        var result = GrowthStageCalculator.Calculate(futureDate, 90);
        Assert.Equal(GrowthStage.NotPlanted, result);
    }

    [Fact]
    public void Calculate_WhenOptimalDurationIsZeroOrNegative_ReturnsNotPlanted()
    {
        var pastDate = DateTime.UtcNow.AddDays(-10);
        Assert.Equal(GrowthStage.NotPlanted, GrowthStageCalculator.Calculate(pastDate, 0));
        Assert.Equal(GrowthStage.NotPlanted, GrowthStageCalculator.Calculate(pastDate, -30));
    }

    [Theory]
    [InlineData(5, 100, GrowthStage.Germination)]    // 5% -> Germination (< 10%)
    [InlineData(15, 100, GrowthStage.Vegetative)]   // 15% -> Vegetative (10% - 29%)
    [InlineData(40, 100, GrowthStage.Flowering)]    // 40% -> Flowering (30% - 59%)
    [InlineData(70, 100, GrowthStage.Fruiting)]     // 70% -> Fruiting (60% - 84%)
    [InlineData(90, 100, GrowthStage.Harvesting)]   // 90% -> Harvesting (85% - 99%)
    [InlineData(105, 100, GrowthStage.PastHarvest)] // 105% -> PastHarvest (>= 100%)
    public void Calculate_ReturnsExpectedStage_BasedOnDaysElapsed(int daysAgo, int totalDays, GrowthStage expectedStage)
    {
        var plantingDate = DateTime.UtcNow.AddDays(-daysAgo);
        var stage = GrowthStageCalculator.Calculate(plantingDate, totalDays);
        Assert.Equal(expectedStage, stage);
    }
}
