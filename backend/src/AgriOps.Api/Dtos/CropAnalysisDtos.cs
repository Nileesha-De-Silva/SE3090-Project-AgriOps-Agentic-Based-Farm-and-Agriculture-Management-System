using System;
using System.Collections.Generic;

namespace AgriOps.Api.Dtos;

public record SubmitCropAnalysisRequestDto(
    Guid FieldId,
    string CropVariety,
    string GrowthStage,
    string ObservationText,
    string ImageUrl,
    Guid SubmittedByUserId
);

public record CropAnalysisAssessmentResponseDto(
    Guid Id,
    Guid WorkflowId,
    Guid FieldId,
    string CropVariety,
    string GrowthStage,
    string ObservationText,
    string ImageUrl,
    string PrimaryIndicator,
    string PotentialStressFactorsJson,
    string RiskLevel,
    string RecommendedActionsJson,
    string SuggestedTaskType,
    string Priority,
    string Status,
    Guid SubmittedByUserId,
    DateTime CreatedAt
);

public record ApproveAssessmentRequestDto(
    Guid ManagerUserId,
    string? Comments
);

public record RejectAssessmentRequestDto(
    Guid ManagerUserId,
    string Comments
);
