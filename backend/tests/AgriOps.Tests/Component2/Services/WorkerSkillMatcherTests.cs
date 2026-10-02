using System;
using System.Linq;
using System.Threading.Tasks;
using AgriOps.Core.Entities;
using AgriOps.Infrastructure.Services;
using AgriOps.Tests.Helpers;
using Xunit;

namespace AgriOps.Tests.Component2.Services;

public class WorkerSkillMatcherTests
{
    private readonly FakeWorkerService _fakeWorkerService;
    private readonly WorkerSkillMatcher _matcher;

    public WorkerSkillMatcherTests()
    {
        _fakeWorkerService = new FakeWorkerService();
        _matcher = new WorkerSkillMatcher(_fakeWorkerService);
    }

    [Fact]
    public async Task FindBestWorkersForTaskAsync_FiltersOutUnqualifiedWorkers()
    {
        // Worker 1: Qualified for PestInspection (has PestDiagnostic skill)
        var qualifiedWorker = TestDataBuilder.CreateWorker(fullName: "Qualified Scout", status: "Active");
        qualifiedWorker.Skills.Add(TestDataBuilder.CreateWorkerSkill(qualifiedWorker.Id, "PestDiagnostic"));

        // Worker 2: Unqualified (has IrrigationSetup skill only)
        var unqualifiedWorker = TestDataBuilder.CreateWorker(fullName: "Unqualified Worker", status: "Active");
        unqualifiedWorker.Skills.Add(TestDataBuilder.CreateWorkerSkill(unqualifiedWorker.Id, "IrrigationSetup"));

        _fakeWorkerService.Workers.AddRange(new[] { qualifiedWorker, unqualifiedWorker });

        var matched = (await _matcher.FindBestWorkersForTaskAsync("PestInspection", topN: 5)).ToList();

        var selected = Assert.Single(matched);
        Assert.Equal(qualifiedWorker.Id, selected.Id);
    }

    [Fact]
    public async Task FindBestWorkersForTaskAsync_FiltersOutInactiveWorkers()
    {
        // Worker has the skill but is Inactive
        var inactiveWorker = TestDataBuilder.CreateWorker(fullName: "Inactive Worker", status: "Inactive");
        inactiveWorker.Skills.Add(TestDataBuilder.CreateWorkerSkill(inactiveWorker.Id, "ChemicalHandling"));

        // Worker has the skill and is Active
        var activeWorker = TestDataBuilder.CreateWorker(fullName: "Active Worker", status: "Active");
        activeWorker.Skills.Add(TestDataBuilder.CreateWorkerSkill(activeWorker.Id, "ChemicalHandling"));

        _fakeWorkerService.Workers.AddRange(new[] { inactiveWorker, activeWorker });

        var matched = (await _matcher.FindBestWorkersForTaskAsync("Fertilization", topN: 5)).ToList();

        var selected = Assert.Single(matched);
        Assert.Equal(activeWorker.Id, selected.Id);
    }

    [Fact]
    public async Task FindBestWorkersForTaskAsync_RanksLowerWorkloadHigher()
    {
        // Both are qualified FullTime workers
        var busyWorker = TestDataBuilder.CreateWorker(fullName: "Busy Worker", employmentType: "FullTime", status: "Active");
        busyWorker.Skills.Add(TestDataBuilder.CreateWorkerSkill(busyWorker.Id, "HeavyMachinery"));
        _fakeWorkerService.Workloads[busyWorker.Id] = 3; // 100 - (3 * 20) + 10 = 50.0

        var freeWorker = TestDataBuilder.CreateWorker(fullName: "Free Worker", employmentType: "FullTime", status: "Active");
        freeWorker.Skills.Add(TestDataBuilder.CreateWorkerSkill(freeWorker.Id, "HeavyMachinery"));
        _fakeWorkerService.Workloads[freeWorker.Id] = 0; // 100 - (0 * 20) + 10 = 110.0

        _fakeWorkerService.Workers.AddRange(new[] { busyWorker, freeWorker });

        var matched = (await _matcher.FindBestWorkersForTaskAsync("EquipmentMaintenance", topN: 5)).ToList();

        Assert.Equal(2, matched.Count);
        Assert.Equal(freeWorker.Id, matched[0].Id); // Free worker should rank first
        Assert.Equal(busyWorker.Id, matched[1].Id);
    }

    [Fact]
    public async Task FindBestWorkersForTaskAsync_GrantsFullTimeStaffBonus()
    {
        // Both have identical workload of 1 task
        var contractor = TestDataBuilder.CreateWorker(fullName: "Contract Worker", employmentType: "Contract", status: "Active");
        contractor.Skills.Add(TestDataBuilder.CreateWorkerSkill(contractor.Id, "IrrigationSetup"));
        _fakeWorkerService.Workloads[contractor.Id] = 1; // 100 - (1 * 20) = 80.0

        var fullTime = TestDataBuilder.CreateWorker(fullName: "FullTime Worker", employmentType: "FullTime", status: "Active");
        fullTime.Skills.Add(TestDataBuilder.CreateWorkerSkill(fullTime.Id, "IrrigationSetup"));
        _fakeWorkerService.Workloads[fullTime.Id] = 1; // 100 - (1 * 20) + 10 = 90.0

        _fakeWorkerService.Workers.AddRange(new[] { contractor, fullTime });

        var matched = (await _matcher.FindBestWorkersForTaskAsync("Watering", topN: 5)).ToList();

        Assert.Equal(2, matched.Count);
        Assert.Equal(fullTime.Id, matched[0].Id); // FullTime should rank ahead due to +10 bonus
        Assert.Equal(contractor.Id, matched[1].Id);
    }

    [Fact]
    public async Task FindBestWorkersForTaskAsync_RespectsTopNLimit()
    {
        for (int i = 1; i <= 6; i++)
        {
            var worker = TestDataBuilder.CreateWorker(fullName: $"Worker {i}", status: "Active");
            worker.Skills.Add(TestDataBuilder.CreateWorkerSkill(worker.Id, "CropHarvesting"));
            _fakeWorkerService.Workloads[worker.Id] = i;
            _fakeWorkerService.Workers.Add(worker);
        }

        var matched = (await _matcher.FindBestWorkersForTaskAsync("Harvesting", topN: 3)).ToList();

        Assert.Equal(3, matched.Count);
    }
}
