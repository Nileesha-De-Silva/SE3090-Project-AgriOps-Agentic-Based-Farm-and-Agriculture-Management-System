using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using AgriOps.Core.Entities;

namespace AgriOps.Core.Interfaces;

public interface ICropAnalysisService
{
    Task<CropAnalysisAssessment> SubmitCropAnalysisRequestAsync(Guid fieldId, string cropVariety, string growthStage, string observationText, string imageUrl, Guid submittedByUserId);
    Task<CropAnalysisAssessment?> GetAssessmentByIdAsync(Guid id);
    Task<IEnumerable<CropAnalysisAssessment>> GetPendingApprovalsAsync();
    Task<FarmTask> ApproveAssessmentAndCreateTaskAsync(Guid assessmentId, Guid managerUserId, string? comments = null);
    Task<bool> RejectAssessmentAsync(Guid assessmentId, Guid managerUserId, string comments);
}
