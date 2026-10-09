using AgriOpsAI.Api.DTOs;

namespace AgriOpsAI.Api.Services;

public interface IAuthService
{
    Task<(AuthResponseDto? Result, string? Error)> RegisterAsync(RegisterDto dto);
    Task<(AuthResponseDto? Result, string? Error)> LoginAsync(LoginDto dto);
}