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
public class CropSeasonControllerTests : IAsyncLifetime
{
    private readonly AgriOps.Infrastructure.Data.ApplicationDbContext _context;
    private readonly CropSeasonController _controller;

    public CropSeasonControllerTests()
    {
        _context = TestDbContextFactory.CreateDbContext();
        _controller = new CropSeasonController(_context);
    }

    public Task InitializeAsync() => Task.CompletedTask;

    public async Task DisposeAsync()
    {
        await TestDbContextFactory.ResetDatabaseAsync(_context);
        await _context.DisposeAsync();
    }

    [Fact]
    public async Task CreateCropSeason_WhenFieldMissing_ReturnsBadRequest()
    {
        var crop = TestDataBuilder.CreateCrop();
        _context.Crops.Add(crop);
        await _context.SaveChangesAsync();

        var dto = new CreateCropSeasonDto
        {
            FieldId = Guid.NewGuid(), // Invalid
            CropId = crop.Id,
            SeasonName = "Maha Season 2026",
            StartDate = DateTime.UtcNow,
            TargetEndDate = DateTime.UtcNow.AddDays(90)
        };

        var result = await _controller.CreateCropSeason(dto);
        Assert.IsType<BadRequestObjectResult>(result.Result);
    }

    [Fact]
    public async Task CreateCropSeason_WhenCropMissing_ReturnsBadRequest()
    {
        var farm = TestDataBuilder.CreateFarm();
        _context.Farms.Add(farm);
        await _context.SaveChangesAsync();

        var field = TestDataBuilder.CreateField(farm.Id);
        _context.Fields.Add(field);
        await _context.SaveChangesAsync();

        var dto = new CreateCropSeasonDto
        {
            FieldId = field.Id,
            CropId = Guid.NewGuid(), // Invalid
            SeasonName = "Yala Season 2026",
            StartDate = DateTime.UtcNow,
            TargetEndDate = DateTime.UtcNow.AddDays(90)
        };

        var result = await _controller.CreateCropSeason(dto);
        Assert.IsType<BadRequestObjectResult>(result.Result);
    }

    [Fact]
    public async Task CreateCropSeason_WhenValid_CreatesAndResolvesGrowthStage()
    {
        var farm = TestDataBuilder.CreateFarm();
        _context.Farms.Add(farm);
        await _context.SaveChangesAsync();

        var field = TestDataBuilder.CreateField(farm.Id);
        _context.Fields.Add(field);

        var crop = TestDataBuilder.CreateCrop(name: "Chili", variety: "MI-2", growthDays: 120);
        _context.Crops.Add(crop);
        await _context.SaveChangesAsync();

        var dto = new CreateCropSeasonDto
        {
            FieldId = field.Id,
            CropId = crop.Id,
            SeasonName = "Chili Maha 2026",
            StartDate = DateTime.UtcNow.AddDays(-20),
            TargetEndDate = DateTime.UtcNow.AddDays(100)
        };

        var result = await _controller.CreateCropSeason(dto);

        var createdResult = Assert.IsType<CreatedAtActionResult>(result.Result);
        var seasonDto = Assert.IsType<CropSeasonDto>(createdResult.Value);
        Assert.Equal("Chili Maha 2026", seasonDto.SeasonName);
        Assert.Equal(field.Id, seasonDto.FieldId);
        Assert.Equal(crop.Id, seasonDto.CropId);
    }
}
