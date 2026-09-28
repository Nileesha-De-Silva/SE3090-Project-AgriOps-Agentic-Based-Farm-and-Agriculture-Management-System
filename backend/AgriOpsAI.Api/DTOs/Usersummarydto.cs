namespace AgriOpsAI.Api.DTOs;

public record UserSummaryDto(
    Guid Id,
    string Username,
    string Email,
    string FullName,
    string? ContactNumber,
    bool IsActive,
    DateTime CreatedAt,
    IEnumerable<string> Roles);