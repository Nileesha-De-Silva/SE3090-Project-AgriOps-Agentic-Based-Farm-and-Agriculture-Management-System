using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using AgriOps.Api.Controllers;
using AgriOps.Api.Dtos;
using AgriOps.Core.Entities;
using AgriOps.Infrastructure.Services;
using AgriOps.Tests.Helpers;
using Xunit;

namespace AgriOps.Tests.Component2.Controllers;

public class WorkersControllerTests
{
    private readonly FakeWorkerService _fakeWorkerService;
    private readonly WorkerSkillMatcher _skillMatcher;
    private readonly WorkersController _controller;

    public WorkersControllerTests()
    {
        _fakeWorkerService = new FakeWorkerService();
        _skillMatcher = new WorkerSkillMatcher(_fakeWorkerService);
        _controller = new WorkersController(_fakeWorkerService, _skillMatcher);
    }

    [Fact]
    public async Task GetAllWorkers_ReturnsOk_WithWorkerResponseDtosAndWorkloads()
    {
        var worker1 = TestDataBuilder.CreateWorker(fullName: "Anura Bandara");
        var worker2 = TestDataBuilder.CreateWorker(fullName: "Chitral Somapala");
        _fakeWorkerService.Workers.AddRange(new[] { worker1, worker2 });
        _fakeWorkerService.Workloads[worker1.Id] = 2;
        _fakeWorkerService.Workloads[worker2.Id] = 0;

        var result = await _controller.GetAllWorkers(status: null);

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var dtos = Assert.IsAssignableFrom<IEnumerable<WorkerResponseDto>>(okResult.Value).ToList();
        Assert.Equal(2, dtos.Count);

        var dto1 = dtos.First(d => d.Id == worker1.Id);
        Assert.Equal(2, dto1.ActiveWorkloadCount);
        var dto2 = dtos.First(d => d.Id == worker2.Id);
        Assert.Equal(0, dto2.ActiveWorkloadCount);
    }

    [Fact]
    public async Task GetWorkerById_WhenExists_ReturnsWorkerWithWorkload()
    {
        var worker = TestDataBuilder.CreateWorker(fullName: "Priyantha Kumara");
        _fakeWorkerService.Workers.Add(worker);
        _fakeWorkerService.Workloads[worker.Id] = 1;

        var result = await _controller.GetWorkerById(worker.Id);

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var dto = Assert.IsType<WorkerResponseDto>(okResult.Value);
        Assert.Equal(worker.Id, dto.Id);
        Assert.Equal("Priyantha Kumara", dto.FullName);
        Assert.Equal(1, dto.ActiveWorkloadCount);
    }

    [Fact]
    public async Task GetWorkerById_WhenNotFound_ReturnsNotFound()
    {
        var result = await _controller.GetWorkerById(Guid.NewGuid());
        Assert.IsType<NotFoundObjectResult>(result.Result);
    }

    [Fact]
    public async Task CreateWorker_ValidDto_ReturnsCreatedAtAction()
    {
        var userId = Guid.NewGuid();
        var dto = new CreateWorkerDto(
            UserId: userId,
            FullName: "Upul Tharanga",
            ContactNumber: "+94711122334",
            EmploymentType: "FullTime"
        );

        var result = await _controller.CreateWorker(dto);

        var createdResult = Assert.IsType<CreatedAtActionResult>(result.Result);
        var responseDto = Assert.IsType<WorkerResponseDto>(createdResult.Value);
        Assert.Equal("Upul Tharanga", responseDto.FullName);
        Assert.Equal("Active", responseDto.Status);
    }

    [Fact]
    public async Task AddSkill_WhenWorkerExists_ReturnsOkWithWorkerSkillDto()
    {
        var worker = TestDataBuilder.CreateWorker();
        _fakeWorkerService.Workers.Add(worker);

        var dto = new AddWorkerSkillDto("ChemicalHandling", "Advanced");
        var result = await _controller.AddSkill(worker.Id, dto);

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var skillDto = Assert.IsType<WorkerSkillDto>(okResult.Value);
        Assert.Equal("ChemicalHandling", skillDto.SkillName);
        Assert.Equal("Advanced", skillDto.ProficiencyLevel);
        Assert.Equal(worker.Id, skillDto.WorkerId);
    }

    [Fact]
    public async Task GetMatchedWorkers_ReturnsRankedWorkersForTaskType()
    {
        var worker = TestDataBuilder.CreateWorker(fullName: "Certified Agronomist", status: "Active");
        worker.Skills.Add(TestDataBuilder.CreateWorkerSkill(worker.Id, "PestDiagnostic"));
        _fakeWorkerService.Workers.Add(worker);

        var result = await _controller.GetMatchedWorkers("PestInspection", topN: 3);

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var dtos = Assert.IsAssignableFrom<IEnumerable<WorkerResponseDto>>(okResult.Value).ToList();
        var matched = Assert.Single(dtos);
        Assert.Equal(worker.Id, matched.Id);
    }
}
