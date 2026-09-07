using System;
using System.Collections.Generic;

namespace AgriOps.Api.Dtos;

public record CreateTaskDto(
    Guid FieldId,
    Guid CropSeasonId,
    string TaskType,
    string Priority,
    string Description,
    DateTime TargetDate
);

public record TaskResponseDto(
    Guid Id,
    Guid FieldId,
    Guid CropSeasonId,
    string TaskType,
    string Priority,
    string Description,
    DateTime TargetDate,
    string Status,
    DateTime CreatedAt,
    DateTime UpdatedAt,
    IEnumerable<TaskAssignmentDto> Assignments,
    TaskScheduleDto? Schedule
);

public record TaskAssignmentDto(
    Guid Id,
    Guid TaskId,
    Guid WorkerId,
    string? WorkerName,
    DateTime AssignedDate,
    string Status
);

public record TaskScheduleDto(
    Guid Id,
    string Frequency,
    DateTime StartDate,
    DateTime? EndDate,
    DateTime NextExecutionDate,
    bool IsActive
);

public record AssignWorkerDto(
    Guid WorkerId
);

public record UpdateTaskStatusDto(
    string NewStatus,
    Guid UserId,
    string? Remarks
);

public record SubmitEvidenceDto(
    string EvidencePhotoUrl,
    string Remarks,
    Guid WorkerUserId
);

public record VerifyEvidenceDto(
    bool IsApproved,
    Guid ManagerUserId,
    string? Remarks
);

public record TaskHistoryDto(
    Guid Id,
    Guid TaskId,
    string PreviousStatus,
    string NewStatus,
    Guid ChangedByUserId,
    string? Remarks,
    string? EvidencePhotoUrl,
    DateTime Timestamp
);
