using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http.Json;
using System.Threading.Tasks;
using AgriOps.Api.Dtos;
using AgriOps.IntegrationTests.Infrastructure;
using Xunit;

namespace AgriOps.IntegrationTests.Modules;

public class WorkforceDispatchTests : IntegrationTestBase
{
    public WorkforceDispatchTests(AgriOpsTestHost host) : base(host)
    {
    }

    [Fact]
    public async Task RegisterWorker_AddSkill_AndVerifyWorkloadCount()
    {
        // 1. Create Worker
        var createDto = new CreateWorkerDto(
            UserId: Guid.NewGuid(),
            FullName: "Kavinda Silva",
            ContactNumber: "+94771234567",
            EmploymentType: "FullTime"
        );

        var postResp = await PostAsJson("/api/workers", createDto);
        Assert.Equal(HttpStatusCode.Created, postResp.StatusCode);

        var worker = await postResp.Content.ReadFromJsonAsync<WorkerResponseDto>(JsonOptions);
        Assert.NotNull(worker);
        Assert.Equal("Kavinda Silva", worker.FullName);
        Assert.Equal(0, worker.ActiveWorkloadCount);

        // 2. Add Skill
        var skillDto = new AddWorkerSkillDto("PestDiagnostic", "Expert");
        var skillResp = await PostAsJson($"/api/workers/{worker.Id}/skills", skillDto);
        Assert.Equal(HttpStatusCode.OK, skillResp.StatusCode);

        // 3. Retrieve Worker details
        var getResp = await GetFromJson<WorkerResponseDto>($"/api/workers/{worker.Id}");
        Assert.NotNull(getResp);
        Assert.Single(getResp.Skills);
        Assert.Equal("PestDiagnostic", getResp.Skills.First().SkillName);
        Assert.Equal(0, getResp.ActiveWorkloadCount);
    }

    [Fact]
    public async Task WorkerSkillMatcher_RanksFullTimeWorkerOverContractorWithZeroWorkload()
    {
        // 1. Create Worker 1: FullTime with PestDiagnostic skill
        var w1 = await (await PostAsJson("/api/workers", new CreateWorkerDto(
            UserId: Guid.NewGuid(),
            FullName: "Sunil FullTime",
            ContactNumber: "+94711111111",
            EmploymentType: "FullTime"
        ))).Content.ReadFromJsonAsync<WorkerResponseDto>(JsonOptions);
        await PostAsJson($"/api/workers/{w1!.Id}/skills", new AddWorkerSkillDto("PestDiagnostic", "Intermediate"));

        // 2. Create Worker 2: Contractor with PestDiagnostic skill
        var w2 = await (await PostAsJson("/api/workers", new CreateWorkerDto(
            UserId: Guid.NewGuid(),
            FullName: "Kamal Contractor",
            ContactNumber: "+94722222222",
            EmploymentType: "Contractor"
        ))).Content.ReadFromJsonAsync<WorkerResponseDto>(JsonOptions);
        await PostAsJson($"/api/workers/{w2!.Id}/skills", new AddWorkerSkillDto("PestDiagnostic", "Intermediate"));

        // 3. Query Matched workers for "PestInspection"
        var matchResp = await Client.GetAsync("/api/workers/matched?taskType=PestInspection&topN=5");
        Assert.Equal(HttpStatusCode.OK, matchResp.StatusCode);

        var matched = await matchResp.Content.ReadFromJsonAsync<List<WorkerResponseDto>>(JsonOptions);
        Assert.NotNull(matched);
        Assert.Equal(2, matched.Count);

        // Sunil FullTime gets 100 + 10 = 110, Kamal Contractor gets 100 + 0 = 100
        Assert.Equal(w1.Id, matched[0].Id);
        Assert.Equal(w2.Id, matched[1].Id);
    }

    [Fact]
    public async Task AssignTaskToWorker_IncrementsActiveWorkloadCount_AndDropsMatchRank()
    {
        // 1. Setup FullTime Worker A & Contractor Worker B with PestDiagnostic
        var wA = await (await PostAsJson("/api/workers", new CreateWorkerDto(
            UserId: Guid.NewGuid(),
            FullName: "Worker Alpha (FullTime)",
            ContactNumber: "+94710000001",
            EmploymentType: "FullTime"
        ))).Content.ReadFromJsonAsync<WorkerResponseDto>(JsonOptions);
        await PostAsJson($"/api/workers/{wA!.Id}/skills", new AddWorkerSkillDto("PestDiagnostic", "Expert"));

        var wB = await (await PostAsJson("/api/workers", new CreateWorkerDto(
            UserId: Guid.NewGuid(),
            FullName: "Worker Beta (Contractor)",
            ContactNumber: "+94710000002",
            EmploymentType: "Contractor"
        ))).Content.ReadFromJsonAsync<WorkerResponseDto>(JsonOptions);
        await PostAsJson($"/api/workers/{wB!.Id}/skills", new AddWorkerSkillDto("PestDiagnostic", "Expert"));

        // 2. Initially Worker A is #1
        var initialMatch = await GetFromJson<List<WorkerResponseDto>>("/api/workers/matched?taskType=PestInspection");
        Assert.NotNull(initialMatch);
        Assert.Equal(wA.Id, initialMatch[0].Id);

        // 3. Create a Task and Assign to Worker A
        var farm = await (await PostAsJson("/api/farm", new CreateFarmDto
        {
            Name = "Dispatch Farm",
            Location = "Z1",
            TotalArea = 10.0m,
            OwnerId = Guid.NewGuid()
        })).Content.ReadFromJsonAsync<FarmDto>(JsonOptions);

        var field = await (await PostAsJson("/api/field", new CreateFieldDto
        {
            FarmId = farm!.Id,
            FieldName = "F1",
            AreaSize = 5.0m,
            SoilType = "Loam"
        })).Content.ReadFromJsonAsync<FieldDto>(JsonOptions);

        var task = await (await PostAsJson("/api/tasks", new CreateTaskDto(
            FieldId: field!.Id,
            CropSeasonId: null,
            Title: "Urgent Pest Spraying",
            TaskType: "PestInspection",
            Priority: "High",
            Description: "Caterpillar infestation",
            TargetDate: DateTime.UtcNow.AddDays(1)
        ))).Content.ReadFromJsonAsync<TaskResponseDto>(JsonOptions);

        var assignResp = await PostAsJson($"/api/tasks/{task!.Id}/assign", new AssignWorkerDto(wA.Id));
        Assert.Equal(HttpStatusCode.OK, assignResp.StatusCode);

        // 4. Verify Worker A workload incremented to 1
        var workerARefreshed = await GetFromJson<WorkerResponseDto>($"/api/workers/{wA.Id}");
        Assert.NotNull(workerARefreshed);
        Assert.Equal(1, workerARefreshed.ActiveWorkloadCount);

        // 5. Dynamic Workload Re-ranking:
        // Worker A score: 100 - (1*20) + 10 = 90
        // Worker B score: 100 - (0*20) + 0 = 100
        // Therefore Worker B is now #1!
        var recomputedMatch = await GetFromJson<List<WorkerResponseDto>>("/api/workers/matched?taskType=PestInspection");
        Assert.NotNull(recomputedMatch);
        Assert.Equal(wB.Id, recomputedMatch[0].Id);
        Assert.Equal(wA.Id, recomputedMatch[1].Id);
    }
}
