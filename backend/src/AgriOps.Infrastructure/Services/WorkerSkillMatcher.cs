using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AgriOps.Core.Entities;
using AgriOps.Core.Interfaces;

namespace AgriOps.Infrastructure.Services;

public class WorkerSkillMatcher
{
    private readonly IWorkerService _workerService;

    public WorkerSkillMatcher(IWorkerService workerService)
    {
        _workerService = workerService;
    }

    public async Task<IEnumerable<Worker>> FindBestWorkersForTaskAsync(string taskType, int topN = 5)
    {
        var activeWorkers = await _workerService.GetAllWorkersAsync(status: "Active");
        var workerScores = new List<(Worker Worker, double Score)>();

        foreach (var worker in activeWorkers)
        {
            bool isQualified = await _workerService.IsWorkerQualifiedForTaskAsync(worker.Id, taskType);
            if (!isQualified)
            {
                continue;
            }

            int activeWorkload = await _workerService.GetActiveTaskLoadCountAsync(worker.Id);

            // Score formula: Higher score for qualified workers with lower current workload
            double score = 100.0 - (activeWorkload * 20.0);

            // Boost score for FullTime staff over contract
            if (worker.EmploymentType == "FullTime")
            {
                score += 10.0;
            }

            workerScores.Add((worker, score));
        }

        return workerScores
            .OrderByDescending(ws => ws.Score)
            .Take(topN)
            .Select(ws => ws.Worker);
    }
}
