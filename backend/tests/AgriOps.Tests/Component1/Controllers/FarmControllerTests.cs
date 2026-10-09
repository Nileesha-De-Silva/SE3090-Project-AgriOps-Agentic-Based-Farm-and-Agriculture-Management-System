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
public class FarmControllerTests : IAsyncLifetime
{
    private readonly AgriOps.Infrastructure.Data.ApplicationDbContext _context;
    private readonly FarmController _controller;

    public FarmControllerTests()
    {
        _context = TestDbContextFactory.CreateDbContext();
        _controller = new FarmController(_context);
    }

    public Task InitializeAsync() => Task.CompletedTask;

    public async Task DisposeAsync()
    {
        await TestDbContextFactory.ResetDatabaseAsync(_context);
        await _context.DisposeAsync();
    }

    [Fact]
    public async Task GetFarms_ReturnsAllFarms()
    {
        var farm1 = TestDataBuilder.CreateFarm(name: "Highland Tea Estate");
        var farm2 = TestDataBuilder.CreateFarm(name: "Lowland Paddy Farm");
        _context.Farms.AddRange(farm1, farm2);
        await _context.SaveChangesAsync();

        var result = await _controller.GetFarms();

        var okResult = Assert.IsType<ActionResult<System.Collections.Generic.IEnumerable<FarmDto>>>(result);
        var farms = okResult.Value!.ToList();
        Assert.Equal(2, farms.Count);
        Assert.Contains(farms, f => f.Name == "Highland Tea Estate");
        Assert.Contains(farms, f => f.Name == "Lowland Paddy Farm");
    }

    [Fact]
    public async Task GetFarm_WhenExists_ReturnsFarmDto()
    {
        var farm = TestDataBuilder.CreateFarm(name: "Sunrise Orchard");
        _context.Farms.Add(farm);
        await _context.SaveChangesAsync();

        var result = await _controller.GetFarm(farm.Id);

        var farmDto = result.Value;
        Assert.NotNull(farmDto);
        Assert.Equal(farm.Id, farmDto.Id);
        Assert.Equal("Sunrise Orchard", farmDto.Name);
    }

    [Fact]
    public async Task GetFarm_WhenNotFound_ReturnsNotFound()
    {
        var result = await _controller.GetFarm(Guid.NewGuid());
        Assert.IsType<NotFoundResult>(result.Result);
    }

    [Fact]
    public async Task CreateFarm_ValidDto_CreatesAndReturnsCreatedAtAction()
    {
        var ownerId = Guid.NewGuid();
        var dto = new CreateFarmDto
        {
            Name = "Organic Horizon Farm",
            Location = "North Central District",
            TotalArea = 25.5m,
            OwnerId = ownerId
        };

        var result = await _controller.CreateFarm(dto);

        var createdResult = Assert.IsType<CreatedAtActionResult>(result.Result);
        var createdFarm = Assert.IsType<FarmDto>(createdResult.Value);
        Assert.Equal("Organic Horizon Farm", createdFarm.Name);
        Assert.Equal(25.5m, createdFarm.TotalArea);
        Assert.Equal(ownerId, createdFarm.OwnerId);

        // Verify database persistence
        var dbFarm = await _context.Farms.FindAsync(createdFarm.Id);
        Assert.NotNull(dbFarm);
        Assert.Equal("Organic Horizon Farm", dbFarm.Name);
    }

    [Fact]
    public async Task UpdateFarm_WhenExists_UpdatesAndReturnsNoContent()
    {
        var farm = TestDataBuilder.CreateFarm(name: "Initial Name");
        _context.Farms.Add(farm);
        await _context.SaveChangesAsync();

        var updateDto = new UpdateFarmDto
        {
            Name = "Updated Name",
            Location = "Updated Location",
            TotalArea = 75.0m
        };

        var result = await _controller.UpdateFarm(farm.Id, updateDto);

        Assert.IsType<NoContentResult>(result);
        var updated = await _context.Farms.FindAsync(farm.Id);
        Assert.Equal("Updated Name", updated!.Name);
        Assert.Equal(75.0m, updated.TotalArea);
    }

    [Fact]
    public async Task DeleteFarm_WhenExists_RemovesAndReturnsNoContent()
    {
        var farm = TestDataBuilder.CreateFarm();
        _context.Farms.Add(farm);
        await _context.SaveChangesAsync();

        var result = await _controller.DeleteFarm(farm.Id);

        Assert.IsType<NoContentResult>(result);
        var dbFarm = await _context.Farms.FindAsync(farm.Id);
        Assert.Null(dbFarm);
    }
}
