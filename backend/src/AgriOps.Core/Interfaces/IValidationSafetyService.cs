using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace AgriOps.Core.Interfaces;

public record ProposalValidationRequestDto(
    string ProposalId,
    string GeneratingAgent,
    Guid TargetFieldId,
    string CropVariety,
    string ProposedAction,
    string InputItemName,
    decimal ProposedQuantity,
    string UnitOfMeasurement,
    string GrowthStage,
    string? SoilType = null
);

public record DeterministicCheckResult(
    string CheckName,
    bool Passed,
    string Message,
    string RuleCode
);

public record ValidationReportDto(
    Guid Id,
    string ProposalId,
    string GeneratingAgent,
    bool IsValid,
    string Decision, // "VALID", "INVALID", "REVISION_REQUESTED"
    string OutcomeSummary,
    List<DeterministicCheckResult> Checks,
    WeatherDataDto WeatherSnapshot,
    List<string> FailureReasons,
    string? RevisionGuidance,
    bool RequiresHumanApproval,
    DateTime CreatedAt
);

public interface IValidationSafetyService
{
    Task<ValidationReportDto> ValidateProposalAsync(ProposalValidationRequestDto request);
    Task<List<ValidationReportDto>> GetValidationHistoryAsync(int take = 50);
    Task<bool> ApproveValidationOutcomeAsync(Guid validationId, Guid managerUserId, string? managerNotes);
}
