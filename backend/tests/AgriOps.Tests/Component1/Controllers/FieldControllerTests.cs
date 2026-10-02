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
public class FieldControllerTests : IAsyncLifetime
{
    private readonly AgriOps.Infrastructure.Data.ApplicationDbContext _context;
    private readonly FieldController _controller;

    public FieldControllerTests()
    {
        _context = TestDbContextFactory.CreateDbContext();
        _controller = new FieldController(_context);
    }

    public Task InitializeAsync() => Task.CompletedTask;

    public async Task DisposeAsync()
    {
        await TestDbContextFactory.ResetDatabaseAsync(_context);
        await _context.DisposeAsync();
    }

    [Fact]
    public async Task CreateField_WhenFarmExists_CreatesFieldAndReturnsCreatedAtAction()
    {
        var farm = TestDataBuilder.CreateFarm();
        _context.Farms.Add(farm);
        await _context.SaveChangesAsync();

        var dto = new CreateFieldDto
        {
            FarmId = farm.Id,
            FieldName = "Paddy Sector B",
            AreaSize = 4.2m,
            SoilType = "Alluvial",
            BoundaryCoordinates = "[[0,0],[1,1]]"
        };

        var result = await _controller.CreateField(dto);

        var createdResult = Assert.IsType<CreatedAtActionResult>(result.Result);
        var fieldDto = Assert.IsType<FieldDto>(createdResult.Value);
        Assert.Equal("Paddy Sector B", fieldDto.FieldName);
        Assert.Equal(farm.Id, fieldDto.FarmId);

        // Verify in DB
        var dbField = await _context.Fields.FindAsync(fieldDto.Id);
        Assert.NotNull(dbField);
        Assert.Equal("Alluvial", dbField.SoilType);
    }

    [Fact]
    public async Task CreateField_WhenFarmDoesNotExist_ReturnsBadRequest()
    {
        var nonExistentFarmId = Guid.NewGuid();
        var dto = new CreateFieldDto
        {
            FarmId = nonExistentFarmId,
            FieldName = "Orphan Field",
            AreaSize = 2.0m,
            SoilType = "Sandy"
        };

        var result = await _controller.CreateField(dto);

        var badRequestResult = Assert.IsType<BadRequestObjectResult>(result.Result);
        Assert.Contains(nonExistentFarmId.ToString(), badRequestResult.Value?.ToString());
    }

    [Fact]
    public async Task GetFields_FiltersByFarmId()
    {
        var farm1 = TestDataBuilder.CreateFarm(name: "Farm 1");
        var farm2 = TestDataBuilder.CreateFarm(name: "Farm 2");
        _context.Farms.AddRange(farm1, farm2);
        await _context.SaveChangesAsync();

        var field1 = TestDataBuilder.CreateField(farm1.Id, name: "Field 1A");
        var field2 = TestDataBuilder.CreateField(farm1.Id, name: "Field 1B");
        var field3 = TestDataBuilder.CreateField(farm2.Id, name: "Field 2A");
        _context.Fields.AddRange(field1, field2, field3);
        await _context.SaveChangesAsync();

        var result = await _controller.GetFields(farm1.Id);

        var okResult = Assert.IsType<ActionResult<System.Collections.Generic.IEnumerable<FieldDto>>>(result);
        var fields = okResult.Value!.ToList();
        Assert.Equal(2, fields.Count);
        Assert.All(fields, f => Assert.Equal(farm1.Id, f.FarmId));
    }
}
