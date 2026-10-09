using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using AgriOps.Api.Controllers;
using AgriOps.Api.Dtos;
using AgriOps.Tests.Helpers;
using Xunit;

namespace AgriOps.Tests.Component1.Controllers;

[Collection("DatabaseTests")]
public class CropControllerTests : IAsyncLifetime
{
    private readonly AgriOps.Infrastructure.Data.ApplicationDbContext _context;
    private readonly CropController _controller;

    public CropControllerTests()
    {
        _context = TestDbContextFactory.CreateDbContext();
        _controller = new CropController(_context);
    }

    public Task InitializeAsync() => Task.CompletedTask;

    public async Task DisposeAsync()
    {
        await TestDbContextFactory.ResetDatabaseAsync(_context);
        await _context.DisposeAsync();
    }

    [Fact]
    public async Task GetCrops_ReturnsAllCrops()
    {
        var crop1 = TestDataBuilder.CreateCrop(name: "Maize", variety: "Pacific 999", growthDays: 105);
        var crop2 = TestDataBuilder.CreateCrop(name: "Paddy", variety: "Bg 352", growthDays: 105);
        _context.Crops.AddRange(crop1, crop2);
        await _context.SaveChangesAsync();

        var result = await _controller.GetCrops();

        var okResult = Assert.IsType<ActionResult<System.Collections.Generic.IEnumerable<CropDto>>>(result);
        var crops = okResult.Value!.ToList();
        Assert.Equal(2, crops.Count);
    }

    [Fact]
    public async Task CreateCrop_ValidDto_CreatesAndReturnsCreatedAtAction()
    {
        var dto = new CreateCropDto
        {
            CropName = "Capsicum",
            Variety = "Indra F1",
            OptimalGrowthDurationDays = 75,
            Description = "High yielding bell pepper variety."
        };

        var result = await _controller.CreateCrop(dto);

        var createdResult = Assert.IsType<CreatedAtActionResult>(result.Result);
        var cropDto = Assert.IsType<CropDto>(createdResult.Value);
        Assert.Equal("Capsicum", cropDto.CropName);
        Assert.Equal("Indra F1", cropDto.Variety);
    }

    [Fact]
    public async Task GetCrop_WhenNotFound_ReturnsNotFound()
    {
        var result = await _controller.GetCrop(Guid.NewGuid());
        Assert.IsType<NotFoundResult>(result.Result);
    }
}
