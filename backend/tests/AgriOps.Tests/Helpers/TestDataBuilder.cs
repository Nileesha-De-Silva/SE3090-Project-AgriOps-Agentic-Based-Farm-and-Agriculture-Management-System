using System;
using AgriOps.Core.Entities;

namespace AgriOps.Tests.Helpers;

public static class TestDataBuilder
{
    public static Farm CreateFarm(Guid? id = null, string name = "Green Valley Farm", decimal totalArea = 50.0m)
    {
        return new Farm
        {
            Id = id ?? Guid.NewGuid(),
            Name = name,
            Location = "Central Province, Plot 4",
            TotalArea = totalArea,
            OwnerId = Guid.NewGuid(),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
    }

    public static Field CreateField(Guid farmId, Guid? id = null, string name = "Field Sector 1", decimal areaSize = 5.0m)
    {
        return new Field
        {
            Id = id ?? Guid.NewGuid(),
            FarmId = farmId,
            FieldName = name,
            AreaSize = areaSize,
            SoilType = "ClayLoam",
            BoundaryCoordinates = "[[0.0, 0.0], [1.0, 1.0]]",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
    }

    public static Crop CreateCrop(Guid? id = null, string name = "Tomato", string variety = "Roma VF", int growthDays = 90)
    {
        return new Crop
        {
            Id = id ?? Guid.NewGuid(),
            CropName = name,
            Variety = variety,
            OptimalGrowthDurationDays = growthDays,
            Description = "Determinate tomato variety for processing."
        };
    }

    public static CropSeason CreateCropSeason(Guid fieldId, Guid cropId, Guid? id = null, string name = "Spring 2026", CropSeasonStatus status = CropSeasonStatus.Active)
    {
        return new CropSeason
        {
            Id = id ?? Guid.NewGuid(),
            FieldId = fieldId,
            CropId = cropId,
            SeasonName = name,
            StartDate = DateTime.UtcNow.AddDays(-30),
            TargetEndDate = DateTime.UtcNow.AddDays(60),
            Status = status
        };
    }

    public static Worker CreateWorker(Guid? id = null, string fullName = "Sunil Perera", string employmentType = "FullTime", string status = "Active")
    {
        return new Worker
        {
            Id = id ?? Guid.NewGuid(),
            UserId = Guid.NewGuid(),
            FullName = fullName,
            ContactNumber = "+94771234567",
            EmploymentType = employmentType,
            Status = status,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
    }

    public static WorkerSkill CreateWorkerSkill(Guid workerId, string skillName, string level = "Advanced")
    {
        return new WorkerSkill
        {
            Id = Guid.NewGuid(),
            WorkerId = workerId,
            SkillName = skillName,
            ProficiencyLevel = level,
            CreatedAt = DateTime.UtcNow
        };
    }

    public static FarmTask CreateFarmTask(Guid? fieldId = null, Guid? cropSeasonId = null, string taskType = "PestInspection", string priority = "High", string status = "Pending")
    {
        return new FarmTask
        {
            Id = Guid.NewGuid(),
            Title = $"Operation {taskType}",
            FieldId = fieldId,
            CropSeasonId = cropSeasonId,
            TaskType = taskType,
            Priority = priority,
            Description = $"Perform field {taskType} according to agricultural SOPs.",
            TargetDate = DateTime.UtcNow.AddDays(2),
            Status = status,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
    }

    public static CropAnalysisAssessment CreateAssessment(Guid fieldId, string suggestedTaskType = "PesticideApplication", string priority = "Critical")
    {
        return new CropAnalysisAssessment
        {
            Id = Guid.NewGuid(),
            WorkflowId = Guid.NewGuid(),
            FieldId = fieldId,
            CropVariety = "Tomato",
            GrowthStage = "Fruiting",
            ObservationText = "Severe foliar necrosis and early blight lesions detected on leaves.",
            ImageUrl = "https://cdn.agriops.io/scans/tomato_blight_01.jpg",
            PrimaryIndicator = "Early Blight (Alternaria solani)",
            PotentialStressFactorsJson = "[\"FungalPathogen\", \"HighHumidity\"]",
            RiskLevel = "High",
            RecommendedActionsJson = "[\"Apply Copper Hydroxide fungicide\", \"Prune lower canopy\"]",
            SuggestedTaskType = suggestedTaskType,
            Priority = priority,
            Status = "PendingReview",
            SubmittedByUserId = Guid.NewGuid(),
            CreatedAt = DateTime.UtcNow
        };
    }
}
