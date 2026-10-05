namespace AgriOpsAI.Api.DTOs;

public record AuthResponseDto(string Token, Guid UserId, string Username, IEnumerable<string> Roles);