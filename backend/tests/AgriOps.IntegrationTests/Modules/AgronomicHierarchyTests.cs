using System;
using System.Collections.Generic;
using System.Net;
using System.Net.Http.Json;
using System.Threading.Tasks;
using AgriOps.Api.Dtos;
using AgriOps.IntegrationTests.Infrastructure;
using Xunit;

namespace AgriOps.IntegrationTests.Modules;

public class AgronomicHierarchyTests : IntegrationTestBase
{
    public AgronomicHierarchyTests(AgriOpsTestHost host) : base(host)
    {
    }

    [Fact]
    public async Task CreateFarm_AndRetrieveById_Returns201AndPersistedData()
    {
        var ownerId = Guid.NewGuid();
        // 1. Create a Farm via HTTP POST
        var farmDto = new CreateFarmDto
        {
            Name = "Green Valley Plantation",
            Location = "Central Highlands, 6.9271, 79.8612",
            TotalArea = 150.5m,
            OwnerId = ownerId
        };

        var postResponse = await PostAsJson("/api/farm", farmDto);
        Assert.Equal(HttpStatusCode.Created, postResponse.StatusCode);

        var createdFarm = await postResponse.Content.ReadFromJsonAsync<FarmDto>(JsonOptions);
        Assert.NotNull(createdFarm);
        Assert.NotEqual(Guid.Empty, createdFarm.Id);
        Assert.Equal("Green Valley Plantation", createdFarm.Name);
        Assert.Equal(150.5m, createdFarm.TotalArea);
        Assert.Equal(ownerId, createdFarm.OwnerId);

        // 2. Retrieve via HTTP GET /api/farm/{id}
        var getResponse = await Client.GetAsync($"/api/farm/{createdFarm.Id}");
        Assert.Equal(HttpStatusCode.OK, getResponse.StatusCode);

        var retrievedFarm = await getResponse.Content.ReadFromJsonAsync<FarmDto>(JsonOptions);
        Assert.NotNull(retrievedFarm);
        Assert.Equal(createdFarm.Id, retrievedFarm.Id);
        Assert.Equal("Green Valley Plantation", retrievedFarm.Name);
    }

    [Fact]
    public async Task CreateField_WithValidFarm_PersistsAndAppearsInFarmFilter()
    {
        // 1. Create Farm
        var farmDto = new CreateFarmDto
        {
            Name = "Hilltop Orchards",
            Location = "Sector 4",
            TotalArea = 80.0m,
            OwnerId = Guid.NewGuid()
        };
        var farm = await (await PostAsJson("/api/farm", farmDto)).Content.ReadFromJsonAsync<FarmDto>(JsonOptions);
        Assert.NotNull(farm);

        // 2. Create Field for this farm
        var fieldDto = new CreateFieldDto
        {
            FarmId = farm.Id,
            FieldName = "Block A - North Terrace",
            AreaSize = 25.0m,
            SoilType = "ClayLoam"
        };

        var fieldPostResponse = await PostAsJson("/api/field", fieldDto);
        Assert.Equal(HttpStatusCode.Created, fieldPostResponse.StatusCode);

        var createdField = await fieldPostResponse.Content.ReadFromJsonAsync<FieldDto>(JsonOptions);
        Assert.NotNull(createdField);
        Assert.Equal(farm.Id, createdField.FarmId);
        Assert.Equal("Block A - North Terrace", createdField.FieldName);

        // 3. Query fields filtered by farmId
        var getListResponse = await Client.GetAsync($"/api/field?farmId={farm.Id}");
        Assert.Equal(HttpStatusCode.OK, getListResponse.StatusCode);

        var fields = await getListResponse.Content.ReadFromJsonAsync<List<FieldDto>>(JsonOptions);
        Assert.NotNull(fields);
        Assert.Single(fields);
        Assert.Equal(createdField.Id, fields[0].Id);
    }

    [Fact]
    public async Task CreateField_WithNonExistentFarm_Returns400BadRequest()
    {
        var invalidFieldDto = new CreateFieldDto
        {
            FarmId = Guid.NewGuid(), // Non-existent
            FieldName = "Ghost Field",
            AreaSize = 10.0m,
            SoilType = "Sandy"
        };

        var response = await PostAsJson("/api/field", invalidFieldDto);
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);

        var errorMsg = await response.Content.ReadAsStringAsync();
        Assert.Contains("does not exist", errorMsg);
    }

    [Fact]
    public async Task UpdateFarm_ModifiesAttributesAndPersists()
    {
        var farmDto = new CreateFarmDto
        {
            Name = "Old Name Farm",
            Location = "Zone 1",
            TotalArea = 50.0m,
            OwnerId = Guid.NewGuid()
        };
        var farm = await (await PostAsJson("/api/farm", farmDto)).Content.ReadFromJsonAsync<FarmDto>(JsonOptions);
        Assert.NotNull(farm);

        var updateDto = new UpdateFarmDto
        {
            Name = "Updated Name Farm",
            Location = "Zone 1 - Renovated",
            TotalArea = 75.0m
        };

        var putResponse = await PutAsJson($"/api/farm/{farm.Id}", updateDto);
        Assert.Equal(HttpStatusCode.NoContent, putResponse.StatusCode);

        var updatedFarm = await GetFromJson<FarmDto>($"/api/farm/{farm.Id}");
        Assert.NotNull(updatedFarm);
        Assert.Equal("Updated Name Farm", updatedFarm.Name);
        Assert.Equal(75.0m, updatedFarm.TotalArea);
    }

    [Fact]
    public async Task DeleteFarm_RemovesFarmFromDatabase()
    {
        var farmDto = new CreateFarmDto
        {
            Name = "Temporary Farm",
            Location = "Zone X",
            TotalArea = 10.0m,
            OwnerId = Guid.NewGuid()
        };
        var farm = await (await PostAsJson("/api/farm", farmDto)).Content.ReadFromJsonAsync<FarmDto>(JsonOptions);
        Assert.NotNull(farm);

        var deleteResponse = await Client.DeleteAsync($"/api/farm/{farm.Id}");
        Assert.Equal(HttpStatusCode.NoContent, deleteResponse.StatusCode);

        var getResponse = await Client.GetAsync($"/api/farm/{farm.Id}");
        Assert.Equal(HttpStatusCode.NotFound, getResponse.StatusCode);
    }
}
