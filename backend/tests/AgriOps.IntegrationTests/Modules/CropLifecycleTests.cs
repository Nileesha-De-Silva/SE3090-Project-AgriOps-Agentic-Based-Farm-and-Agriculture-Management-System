using System;
using System.Collections.Generic;
using System.Net;
using System.Net.Http.Json;
using System.Threading.Tasks;
using AgriOps.Api.Dtos;
using AgriOps.Core.Entities;
using AgriOps.IntegrationTests.Infrastructure;
using Xunit;

namespace AgriOps.IntegrationTests.Modules;

public class CropLifecycleTests : IntegrationTestBase
{
    public CropLifecycleTests(AgriOpsTestHost host) : base(host)
    {
    }

    [Fact]
    public async Task CreateCrop_PersistsCropCatalogItem()
    {
        var cropDto = new CreateCropDto
        {
            CropName = "Bell Pepper",
            Variety = "California Wonder",
            OptimalGrowthDurationDays = 85,
            Description = "Sweet bell pepper variety"
        };

        var postResponse = await PostAsJson("/api/crop", cropDto);
        Assert.Equal(HttpStatusCode.Created, postResponse.StatusCode);

        var crop = await postResponse.Content.ReadFromJsonAsync<CropDto>(JsonOptions);
        Assert.NotNull(crop);
        Assert.Equal("Bell Pepper", crop.CropName);
        Assert.Equal(85, crop.OptimalGrowthDurationDays);

        var getCrop = await GetFromJson<CropDto>($"/api/crop/{crop.Id}");
        Assert.NotNull(getCrop);
        Assert.Equal("California Wonder", getCrop.Variety);
    }

    [Fact]
    public async Task CreateCropSeason_WithPlanting_ComputesGrowthStageViaCalculator()
    {
        // 1. Setup Farm & Field
        var farm = await (await PostAsJson("/api/farm", new CreateFarmDto
        {
            Name = "Sun Farms",
            Location = "Plot 1",
            TotalArea = 50.0m,
            OwnerId = Guid.NewGuid()
        })).Content.ReadFromJsonAsync<FarmDto>(JsonOptions);

        var field = await (await PostAsJson("/api/field", new CreateFieldDto
        {
            FarmId = farm!.Id,
            FieldName = "Field Beta",
            AreaSize = 10.0m,
            SoilType = "Loamy"
        })).Content.ReadFromJsonAsync<FieldDto>(JsonOptions);

        // 2. Setup Crop with 100 days duration
        var crop = await (await PostAsJson("/api/crop", new CreateCropDto
        {
            CropName = "Sweet Corn",
            Variety = "Golden Bantam",
            OptimalGrowthDurationDays = 100
        })).Content.ReadFromJsonAsync<CropDto>(JsonOptions);

        // 3. Create Season
        var seasonDto = new CreateCropSeasonDto
        {
            FieldId = field!.Id,
            CropId = crop!.Id,
            SeasonName = "Summer 2026 Season",
            StartDate = DateTime.UtcNow.AddDays(-30),
            TargetEndDate = DateTime.UtcNow.AddDays(70),
            Status = CropSeasonStatus.Active
        };

        var seasonResponse = await PostAsJson("/api/cropseason", seasonDto);
        Assert.Equal(HttpStatusCode.Created, seasonResponse.StatusCode);

        var createdSeason = await seasonResponse.Content.ReadFromJsonAsync<CropSeasonDto>(JsonOptions);
        Assert.NotNull(createdSeason);
        Assert.Equal("Summer 2026 Season", createdSeason.SeasonName);
        // Before planting, stage is NotPlanted
        Assert.Equal(GrowthStage.NotPlanted, createdSeason.CurrentGrowthStage);

        // 4. Record Planting planted 20 days ago (20% elapsed of 100 days => Vegetative stage)
        var plantingDto = new CreatePlantingDto
        {
            PlantingDate = DateTime.UtcNow.AddDays(-20),
            InitialQuantity = 500.0m,
            PlantingMethod = "Direct Seeding",
            Notes = "First plot planted"
        };

        var plantingResp = await PostAsJson($"/api/cropseason/{createdSeason.Id}/planting", plantingDto);
        Assert.Equal(HttpStatusCode.Created, plantingResp.StatusCode);

        // 5. Query CropSeason again: GrowthStageCalculator calculates Vegetative stage!
        var refreshedSeason = await GetFromJson<CropSeasonDto>($"/api/cropseason/{createdSeason.Id}");
        Assert.NotNull(refreshedSeason);
        Assert.Equal(GrowthStage.Vegetative, refreshedSeason.CurrentGrowthStage);
    }

    [Fact]
    public async Task RecordSoilRecord_LinkedToField_StoresNutrientProfile()
    {
        var farm = await (await PostAsJson("/api/farm", new CreateFarmDto
        {
            Name = "Soil Test Farm",
            Location = "Zone S",
            TotalArea = 30.0m,
            OwnerId = Guid.NewGuid()
        })).Content.ReadFromJsonAsync<FarmDto>(JsonOptions);

        var field = await (await PostAsJson("/api/field", new CreateFieldDto
        {
            FarmId = farm!.Id,
            FieldName = "Field S1",
            AreaSize = 8.0m,
            SoilType = "Silty"
        })).Content.ReadFromJsonAsync<FieldDto>(JsonOptions);

        var soilDto = new CreateSoilRecordDto
        {
            TestDate = DateTime.UtcNow,
            PhLevel = 6.4m,
            NitrogenLevel = 115.5m,
            PhosphorusLevel = 42.0m,
            PotassiumLevel = 210.0m,
            Notes = "Optimal pH for tea and paddy"
        };

        var soilResponse = await PostAsJson($"/api/field/{field!.Id}/soilrecord", soilDto);
        Assert.Equal(HttpStatusCode.Created, soilResponse.StatusCode);

        var createdSoil = await soilResponse.Content.ReadFromJsonAsync<SoilRecordDto>(JsonOptions);
        Assert.NotNull(createdSoil);
        Assert.Equal(6.4m, createdSoil.PhLevel);
        Assert.Equal(115.5m, createdSoil.NitrogenLevel);
        Assert.Equal(field.Id, createdSoil.FieldId);
    }

    [Fact]
    public async Task RecordHarvest_LinkedToSeason_StoresYieldData()
    {
        var farm = await (await PostAsJson("/api/farm", new CreateFarmDto
        {
            Name = "Harvest Farm",
            Location = "Zone H",
            TotalArea = 50.0m,
            OwnerId = Guid.NewGuid()
        })).Content.ReadFromJsonAsync<FarmDto>(JsonOptions);

        var field = await (await PostAsJson("/api/field", new CreateFieldDto
        {
            FarmId = farm!.Id,
            FieldName = "Field H1",
            AreaSize = 12.0m,
            SoilType = "Clay"
        })).Content.ReadFromJsonAsync<FieldDto>(JsonOptions);

        var crop = await (await PostAsJson("/api/crop", new CreateCropDto
        {
            CropName = "Tomato",
            Variety = "Beefsteak",
            OptimalGrowthDurationDays = 90
        })).Content.ReadFromJsonAsync<CropDto>(JsonOptions);

        var season = await (await PostAsJson("/api/cropseason", new CreateCropSeasonDto
        {
            FieldId = field!.Id,
            CropId = crop!.Id,
            SeasonName = "Autumn Tomato Season",
            StartDate = DateTime.UtcNow.AddDays(-95),
            TargetEndDate = DateTime.UtcNow.AddDays(5),
            Status = CropSeasonStatus.Active
        })).Content.ReadFromJsonAsync<CropSeasonDto>(JsonOptions);

        var harvestDto = new CreateHarvestDto
        {
            HarvestDate = DateTime.UtcNow,
            YieldAmount = 5420.0m,
            QualityGrade = "Premium Grade A",
            RecordedByUserId = Guid.NewGuid()
        };

        var harvestResponse = await PostAsJson($"/api/cropseason/{season!.Id}/harvest", harvestDto);
        Assert.Equal(HttpStatusCode.Created, harvestResponse.StatusCode);

        var createdHarvest = await harvestResponse.Content.ReadFromJsonAsync<HarvestDto>(JsonOptions);
        Assert.NotNull(createdHarvest);
        Assert.Equal(5420.0m, createdHarvest.YieldAmount);
        Assert.Equal("Premium Grade A", createdHarvest.QualityGrade);
    }
}
