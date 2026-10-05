using AgriOpsAI.Api.Data;
using AgriOpsAI.Api.DTOs;
using AgriOpsAI.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace AgriOpsAI.Api.Services;

public class AuthService : IAuthService
{
    private readonly AgriOpsDbContext _db;
    private readonly ITokenService _tokenService;
    private readonly IAuditLogService _auditLogService;

    public AuthService(AgriOpsDbContext db, ITokenService tokenService, IAuditLogService auditLogService)
    {
        _db = db;
        _tokenService = tokenService;
        _auditLogService = auditLogService;
    }

    public async Task<(AuthResponseDto? Result, string? Error)> RegisterAsync(RegisterDto dto)
    {
        var exists = await _db.Users.AnyAsync(u => u.Username == dto.Username || u.Email == dto.Email);
        if (exists)
            return (null, "Username or email is already taken.");

        var role = await _db.Roles.FirstOrDefaultAsync(r => r.RoleName == dto.RoleName);
        if (role is null)
            return (null, $"Role '{dto.RoleName}' does not exist.");

        var user = new User
        {
            Id = Guid.NewGuid(),
            Username = dto.Username,
            Email = dto.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            FullName = dto.FullName,
            ContactNumber = dto.ContactNumber,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _db.Users.Add(user);
        _db.UserRoles.Add(new UserRole { Id = Guid.NewGuid(), UserId = user.Id, RoleId = role.Id });
        await _db.SaveChangesAsync();

        var token = _tokenService.GenerateToken(user, new[] { role.RoleName });
        return (new AuthResponseDto(token, user.Id, user.Username, new[] { role.RoleName }), null);
    }

    public async Task<(AuthResponseDto? Result, string? Error)> LoginAsync(LoginDto dto)
    {
        var user = await _db.Users
            .Include(u => u.UserRoles)
            .ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(u => u.Username == dto.Username);

        if (user is null || !user.IsActive || !BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
        {
            await _auditLogService.LogAsync(user?.Id, "USER_LOGIN_FAILED", $"Failed login attempt for username '{dto.Username}'.");
            return (null, "Invalid username or password.");
        }

        var roles = user.UserRoles.Select(ur => ur.Role.RoleName).ToArray();
        var token = _tokenService.GenerateToken(user, roles);

        await _auditLogService.LogAsync(user.Id, "USER_LOGIN");

        return (new AuthResponseDto(token, user.Id, user.Username, roles), null);
    }
}