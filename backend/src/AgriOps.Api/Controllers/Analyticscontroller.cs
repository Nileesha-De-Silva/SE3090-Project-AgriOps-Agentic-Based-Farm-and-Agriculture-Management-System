using AgriOpsAI.Api.Data;
using AgriOpsAI.Api.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AgriOpsAI.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Administrator,FarmManager,Agronomist")]
public class AnalyticsController : ControllerBase
{
    private readonly AgriOpsDbContext _db;

    public AnalyticsController(AgriOpsDbContext db)
    {
        _db = db;
    }

    // 1. GET /api/analytics/harvest-yields
    // Historical Production Trends: seasonal harvest yields per field, per crop.
    [HttpGet("harvest-yields")]
    public async Task<IActionResult> GetHarvestYields()
    {
        var rawHarvests = await _db.Harvests
            .Include(h => h.CropSeason).ThenInclude(cs => cs!.Field)
            .Include(h => h.CropSeason).ThenInclude(cs => cs!.Crop)
            .ToListAsync();

        var results = rawHarvests
            .Where(h => h.CropSeason != null && h.CropSeason.Field != null && h.CropSeason.Crop != null)
            .GroupBy(h => new
            {
                h.CropSeason!.FieldId,
                h.CropSeason.Field!.FieldName,
                h.CropSeasonId,
                h.CropSeason.SeasonName,
                h.CropSeason.StartDate,
                CropName = h.CropSeason.Crop!.CropName
            })
            .Select(g => new SeasonYieldDto(
                g.Key.FieldId,
                g.Key.FieldName,
                g.Key.CropSeasonId,
                g.Key.SeasonName,
                g.Key.StartDate,
                g.Key.CropName,
                g.Sum(h => h.YieldAmount)))
            .OrderBy(d => d.StartDate)
            .ToList();

        return Ok(results);
    }

    // 2. GET /api/analytics/resource-efficiency
    // Resource & Water Efficiency Analytics: Aggregates Component 3 Inventory & Task logs against harvest yields.
    [HttpGet("resource-efficiency")]
    public async Task<IActionResult> GetResourceEfficiency()
    {
        var totalYield = await _db.Harvests.SumAsync(h => h.YieldAmount);

        var transactions = await _db.InventoryTransactions
            .Include(t => t.InventoryItem)
            .ToListAsync();

        var tasks = await _db.Tasks.ToListAsync();

        var breakdown = transactions
            .Where(t => t.InventoryItem != null)
            .GroupBy(t => new { t.InventoryItem!.Category, t.InventoryItem.Name, t.InventoryItem.UnitOfMeasurement, t.InventoryItem.UnitCost })
            .Select(g =>
            {
                var totalQty = g.Sum(x => x.Quantity);
                var categoryLower = g.Key.Category?.ToLowerInvariant() ?? "";
                var cost = totalQty * g.Key.UnitCost;

                int relatedTasks = tasks.Count(tk =>
                    (categoryLower.Contains("water") && tk.TaskType.ToLower().Contains("water")) ||
                    (categoryLower.Contains("fertil") && tk.TaskType.ToLower().Contains("fertil")) ||
                    (categoryLower.Contains("pestic") && (tk.TaskType.ToLower().Contains("pest") || tk.TaskType.ToLower().Contains("spray")))
                );

                double perYield = totalYield > 0 ? (double)(totalQty / totalYield) : 0;

                return new ResourceEfficiencyItemDto(
                    g.Key.Category ?? "General",
                    g.Key.Name,
                    totalQty,
                    g.Key.UnitOfMeasurement ?? "Units",
                    cost,
                    relatedTasks,
                    Math.Round(perYield, 4)
                );
            })
            .OrderByDescending(r => r.EstimatedTotalCost)
            .ToList();

        decimal totalWater = breakdown.Where(b => b.Category.ToLower().Contains("water")).Sum(b => b.TotalConsumedQuantity);
        decimal totalFert = breakdown.Where(b => b.Category.ToLower().Contains("fertil")).Sum(b => b.TotalConsumedQuantity);
        decimal totalPest = breakdown.Where(b => b.Category.ToLower().Contains("pestic")).Sum(b => b.TotalConsumedQuantity);

        var report = new ResourceEfficiencyReportDto(
            totalWater,
            totalFert,
            totalPest,
            totalYield,
            totalYield > 0 ? Math.Round((double)(totalWater / totalYield), 2) : 0,
            totalYield > 0 ? Math.Round((double)(totalFert / totalYield), 4) : 0,
            breakdown
        );

        return Ok(report);
    }

    // 3. GET /api/analytics/worker-workload
    // Worker Workload & Performance Metrics: Analyzes task assignment turnaround times, completion success rates, and labor distribution.
    [HttpGet("worker-workload")]
    public async Task<IActionResult> GetWorkerWorkload()
    {
        var workers = await _db.Workers
            .Include(w => w.TaskAssignments)
                .ThenInclude(a => a.Task)
            .ToListAsync();

        var metrics = workers.Select(w =>
        {
            var assignments = w.TaskAssignments ?? new List<AgriOps.Core.Entities.TaskAssignment>();
            var tasks = assignments.Where(a => a.Task != null).Select(a => a.Task!).ToList();

            int total = tasks.Count;
            int completed = tasks.Count(t => t.Status == "Completed");
            int inProgress = tasks.Count(t => t.Status == "InProgress");
            int pending = tasks.Count(t => t.Status == "Pending" || t.Status == "Assigned" || t.Status == "PendingVerification");

            double completionRate = total > 0 ? Math.Round((double)completed / total * 100.0, 1) : 0;

            var turnaroundHours = assignments
                .Where(a => a.Task != null && a.Task.Status == "Completed")
                .Select(a => (a.Task!.UpdatedAt - a.AssignedDate).TotalHours)
                .Where(h => h > 0)
                .ToList();

            double avgHours = turnaroundHours.Any() ? Math.Round(turnaroundHours.Average(), 1) : 0;

            int activeLoad = inProgress + pending;
            string burnoutRisk = activeLoad >= 5 ? "High" : (activeLoad >= 3 ? "Medium" : "Low");

            return new WorkerWorkloadMetricDto(
                w.Id,
                w.FullName,
                w.EmploymentType,
                w.Status,
                total,
                completed,
                inProgress,
                pending,
                completionRate,
                avgHours,
                burnoutRisk
            );
        }).OrderByDescending(m => m.InProgressTasks + m.PendingTasks).ToList();

        var summary = new WorkerWorkloadSummaryDto(
            workers.Count(w => w.Status == "Active"),
            metrics.Sum(m => m.TotalTasksAssigned),
            metrics.Any() ? Math.Round(metrics.Average(m => m.CompletionRatePercent), 1) : 0,
            metrics.Count(m => m.BurnoutRiskLevel == "High"),
            metrics
        );

        return Ok(summary);
    }
}

// Data Transfer Objects for Analytics
public record ResourceEfficiencyItemDto(
    string Category,
    string ItemName,
    decimal TotalConsumedQuantity,
    string UnitOfMeasurement,
    decimal EstimatedTotalCost,
    int RelatedTasksCount,
    double ConsumptionPerKgYield
);

public record ResourceEfficiencyReportDto(
    decimal TotalWaterConsumedLiters,
    decimal TotalFertilizerConsumedKg,
    decimal TotalPesticideConsumedLiters,
    decimal TotalHarvestYieldKg,
    double WaterEfficiencyRatioLitersPerKg,
    double FertilizerEfficiencyRatioKgPerKg,
    List<ResourceEfficiencyItemDto> ResourceBreakdown
);

public record WorkerWorkloadMetricDto(
    Guid WorkerId,
    string FullName,
    string EmploymentType,
    string Status,
    int TotalTasksAssigned,
    int CompletedTasks,
    int InProgressTasks,
    int PendingTasks,
    double CompletionRatePercent,
    double AverageTurnaroundHours,
    string BurnoutRiskLevel
);

public record WorkerWorkloadSummaryDto(
    int TotalActiveWorkers,
    int TotalTasksTracked,
    double AverageTeamCompletionRatePercent,
    int HighBurnoutRiskCount,
    List<WorkerWorkloadMetricDto> WorkerMetrics
);