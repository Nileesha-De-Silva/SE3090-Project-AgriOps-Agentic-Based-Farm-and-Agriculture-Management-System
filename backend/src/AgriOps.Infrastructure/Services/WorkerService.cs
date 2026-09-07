using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using AgriOps.Core.Entities;
using AgriOps.Core.Interfaces;
using AgriOps.Infrastructure.Data;

namespace AgriOps.Infrastructure.Services;

public class WorkerService : IWorkerService
{
    private readonly ApplicationDbContext _dbContext;

    public WorkerService(ApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<Worker?> GetWorkerByIdAsync(Guid id)
    {
        return await _dbContext.Workers
            .Include(w => w.Skills)
            .Include(w => w.TaskAssignments)
            .AsNoTracking()
            .FirstOrDefaultAsync(w => w.Id == id);
    }

    public async Task<Worker?> GetWorkerByUserIdAsync(Guid userId)
    {
        return await _dbContext.Workers
            .Include(w => w.Skills)
            .AsNoTracking()
            .FirstOrDefaultAsync(w => w.UserId == userId);
    }

    public async Task<IEnumerable<Worker>> GetAllWorkersAsync(string? status = null)
    {
        var query = _dbContext.Workers
            .Include(w => w.Skills)
            .Include(w => w.TaskAssignments)
            .AsNoTracking()
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(status))
        {
            query = query.Where(w => w.Status == status);
        }

        return await query.OrderBy(w => w.FullName).ToListAsync();
    }

    public async Task<Worker> CreateWorkerAsync(Worker worker)
    {
        if (worker.Id == Guid.Empty)
        {
            worker.Id = Guid.NewGuid();
        }

        worker.CreatedAt = DateTime.UtcNow;
        worker.UpdatedAt = DateTime.UtcNow;

        _dbContext.Workers.Add(worker);
        await _dbContext.SaveChangesAsync();

        return worker;
    }

    public async Task<WorkerSkill> AddWorkerSkillAsync(Guid workerId, string skillName, string proficiencyLevel)
    {
        var worker = await _dbContext.Workers.FirstOrDefaultAsync(w => w.Id == workerId);
        if (worker == null)
        {
            throw new InvalidOperationException($"Worker with ID '{workerId}' not found.");
        }

        var skill = new WorkerSkill
        {
            Id = Guid.NewGuid(),
            WorkerId = workerId,
            SkillName = skillName,
            ProficiencyLevel = proficiencyLevel,
            CreatedAt = DateTime.UtcNow
        };

        _dbContext.WorkerSkills.Add(skill);
        await _dbContext.SaveChangesAsync();

        return skill;
    }

    public async Task<IEnumerable<WorkerSkill>> GetWorkerSkillsAsync(Guid workerId)
    {
        return await _dbContext.WorkerSkills
            .AsNoTracking()
            .Where(s => s.WorkerId == workerId)
            .ToListAsync();
    }

    public async Task<bool> IsWorkerQualifiedForTaskAsync(Guid workerId, string taskType)
    {
        var worker = await _dbContext.Workers
            .Include(w => w.Skills)
            .AsNoTracking()
            .FirstOrDefaultAsync(w => w.Id == workerId);

        if (worker == null || worker.Status != "Active")
        {
            return false;
        }

        // Map task types to required skills
        var requiredSkill = taskType switch
        {
            "Watering" => "IrrigationSetup",
            "Fertilization" => "ChemicalHandling",
            "PestInspection" => "PestDiagnostic",
            "EquipmentMaintenance" => "HeavyMachinery",
            "Harvesting" => "CropHarvesting",
            _ => null
        };

        // If no special skill required, worker is qualified
        if (requiredSkill == null)
        {
            return true;
        }

        return worker.Skills.Any(s => s.SkillName.Equals(requiredSkill, StringComparison.OrdinalIgnoreCase));
    }

    public async Task<int> GetActiveTaskLoadCountAsync(Guid workerId)
    {
        return await _dbContext.TaskAssignments
            .AsNoTracking()
            .CountAsync(a => a.WorkerId == workerId && a.Status == "Active");
    }
}
