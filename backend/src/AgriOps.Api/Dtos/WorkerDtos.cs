using System;
using System.Collections.Generic;

namespace AgriOps.Api.Dtos;

public record CreateWorkerDto(
    Guid UserId,
    string FullName,
    string ContactNumber,
    string EmploymentType
);

public record WorkerResponseDto(
    Guid Id,
    Guid UserId,
    string FullName,
    string ContactNumber,
    string EmploymentType,
    string Status,
    DateTime CreatedAt,
    IEnumerable<WorkerSkillDto> Skills,
    int ActiveWorkloadCount
);

public record AddWorkerSkillDto(
    string SkillName,
    string ProficiencyLevel
);

public record WorkerSkillDto(
    Guid Id,
    Guid WorkerId,
    string SkillName,
    string ProficiencyLevel,
    DateTime CreatedAt
);
