using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using AgriOps.Api.Controllers;
using AgriOps.Api.Dtos;
using AgriOps.Core.Entities;
using AgriOps.Tests.Helpers;
using Xunit;

namespace AgriOps.Tests.Component1.Controllers;

[Collection("DatabaseTests")]
public class PlantingHarvestSoilTests : IAsyncLifetime
{
    private readonly AgriOps.Infrastructure.Data.ApplicationDbContext _context;
    private readonly PlantingController _plantingController;
    private readonly HarvestController _harvestController;
    private readonly SoilRecordController _soilController;

    public PlantingHarvestSoilTests()
    {
        _context = TestDbContextFactory.CreateDbContext();
        _plantingController = new PlantingController(_context);
        _harvestController = new HarvestController(_context);
        _soilController = new SoilRecordController(_context);
    }

    public Task InitializeAsync() => Task.CompletedTask;

    public async Task DisposeAsync()
    {
        await TestDbContextFactory.ResetDatabaseAsync(_context);
        await _context.DisposeAsync();
    }

    private async Task<(Field field, CropSeason season)> SetupFieldAndSeasonAsync()
    {
        var farm = TestDataBuilder.CreateFarm();
        _context.Farms.Add(farm);
        await _context.SaveChangesAsync();

        var field = TestDataBuilder.CreateField(farm.Id);
        _context.Fields.Add(field);

        var crop = TestDataBuilder.CreateCrop();
        _context.Crops.Add(crop);
        await _context.SaveChangesAsync();

        var season = TestDataBuilder.CreateCropSeason(field.Id, crop.Id);
        _context.CropSeasons.Add(season);
        await _context.SaveChangesAsync();

        return (field, season);
    }

    [Fact]
    public async Task CreatePlanting_WhenCropSeasonExists_CreatesPlanting()
    {
        var (_, season) = await SetupFieldAndSeasonAsync();

        var dto = new CreatePlantingDto
        {
            PlantingDate = DateTime.UtcNow,
            InitialQuantity = 1500,
            PlantingMethod = "Transplanting Seedlings",
            Notes = "Planted under mulch sheeting."
        };

        var result = await _plantingController.CreatePlanting(season.Id, dto);

        var createdResult = Assert.IsType<CreatedAtActionResult>(result.Result);
        var plantingDto = Assert.IsType<PlantingDto>(createdResult.Value);
        Assert.Equal(1500, plantingDto.InitialQuantity);
        Assert.Equal(season.Id, plantingDto.CropSeasonId);
    }

    [Fact]
    public async Task CreatePlanting_WhenCropSeasonMissing_ReturnsBadRequest()
    {
        var dto = new CreatePlantingDto
        {
            PlantingDate = DateTime.UtcNow,
            InitialQuantity = 500,
            PlantingMethod = "Direct Seeding"
        };

        var result = await _plantingController.CreatePlanting(Guid.NewGuid(), dto);
        Assert.IsType<BadRequestObjectResult>(result.Result);
    }

    [Fact]
    public async Task CreateHarvest_WhenCropSeasonExists_RecordsYield()
    {
        var (_, season) = await SetupFieldAndSeasonAsync();

        var userId = Guid.NewGuid();
        var dto = new CreateHarvestDto
        {
            HarvestDate = DateTime.UtcNow,
            YieldAmount = 4500.5m,
            QualityGrade = "Grade A",
            RecordedByUserId = userId
        };

        var result = await _harvestController.CreateHarvest(season.Id, dto);

        var createdResult = Assert.IsType<CreatedAtActionResult>(result.Result);
        var harvestDto = Assert.IsType<HarvestDto>(createdResult.Value);
        Assert.Equal(4500.5m, harvestDto.YieldAmount);
        Assert.Equal("Grade A", harvestDto.QualityGrade);
    }

    [Fact]
    public async Task CreateSoilRecord_WhenFieldExists_StoresNutrientProfile()
    {
        var (field, _) = await SetupFieldAndSeasonAsync();

        var dto = new CreateSoilRecordDto
        {
            TestDate = DateTime.UtcNow,
            PhLevel = 6.5m,
            NitrogenLevel = 45.2m,
            PhosphorusLevel = 28.0m,
            PotassiumLevel = 180.5m,
            Notes = "Optimal pH for tomato cultivation."
        };

        var result = await _soilController.CreateSoilRecord(field.Id, dto);

        var createdResult = Assert.IsType<CreatedAtActionResult>(result.Result);
        var soilDto = Assert.IsType<SoilRecordDto>(createdResult.Value);
        Assert.Equal(6.5m, soilDto.PhLevel);
        Assert.Equal(field.Id, soilDto.FieldId);
    }

    [Fact]
    public async Task CreateSoilRecord_WhenFieldMissing_ReturnsBadRequest()
    {
        var dto = new CreateSoilRecordDto
        {
            TestDate = DateTime.UtcNow,
            PhLevel = 7.0m,
            NitrogenLevel = 30.0m,
            PhosphorusLevel = 20.0m,
            PotassiumLevel = 150.0m
        };

        var result = await _soilController.CreateSoilRecord(Guid.NewGuid(), dto);
        Assert.IsType<BadRequestObjectResult>(result.Result);
    }
}
