using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AgriOps.Core.Entities;
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
        var normalizedUsername = dto.Username?.Trim() ?? string.Empty;
        var normalizedEmail = dto.Email?.Trim() ?? string.Empty;

        if (string.IsNullOrWhiteSpace(normalizedUsername))
            return (null, "Username is required.");

        if (string.IsNullOrWhiteSpace(dto.Password) || dto.Password.Length < 8)
            return (null, "Password must be at least 8 characters long.");

        var exists = await _db.Users.AnyAsync(u => 
            u.Username.ToLower() == normalizedUsername.ToLower() || 
            u.Email.ToLower() == normalizedEmail.ToLower());

        if (exists)
            return (null, "Username or email is already registered in the system.");

        // Normalize requested role:
        // Web Dashboard: Administrator, FarmManager, Agronomist
        // Mobile Client: FieldWorker, Farmer
        var requestedRole = dto.RoleName?.Trim();
        string targetRoleName;
        if (string.Equals(requestedRole, "Administrator", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(requestedRole, "Admin", StringComparison.OrdinalIgnoreCase))
        {
            targetRoleName = "Administrator";
        }
        else if (string.Equals(requestedRole, "FarmManager", StringComparison.OrdinalIgnoreCase) ||
                 string.Equals(requestedRole, "Manager", StringComparison.OrdinalIgnoreCase) ||
                 string.Equals(requestedRole, "farm_manager", StringComparison.OrdinalIgnoreCase))
        {
            targetRoleName = "FarmManager";
        }
        else if (string.Equals(requestedRole, "Agronomist", StringComparison.OrdinalIgnoreCase))
        {
            targetRoleName = "Agronomist";
        }
        else if (string.Equals(requestedRole, "FieldWorker", StringComparison.OrdinalIgnoreCase) ||
                 string.Equals(requestedRole, "Field Worker", StringComparison.OrdinalIgnoreCase) ||
                 string.Equals(requestedRole, "field_worker", StringComparison.OrdinalIgnoreCase) ||
                 string.Equals(requestedRole, "Worker", StringComparison.OrdinalIgnoreCase) ||
                 string.Equals(requestedRole, "FarmWorker", StringComparison.OrdinalIgnoreCase))
        {
            targetRoleName = "FieldWorker";
        }
        else if (string.Equals(requestedRole, "Farmer", StringComparison.OrdinalIgnoreCase))
        {
            targetRoleName = "Farmer";
        }
        else
        {
            return (null, $"Invalid role '{dto.RoleName}'. Supported roles: 'FieldWorker', 'Farmer', 'Administrator', 'FarmManager', or 'Agronomist'.");
        }

        var role = await _db.Roles.FirstOrDefaultAsync(r => r.RoleName == targetRoleName);
        if (role is null)
        {
            string desc = targetRoleName switch
            {
                "FieldWorker" => "Mobile task execution, scouting observations, and evidence upload",
                "Farmer" => "Mobile field registration, crop observations, and task monitoring",
                "Agronomist" => "Crop health analytics, historical yield evaluation, and agronomic planning",
                "FarmManager" => "Farm operations, task management, workload review, and approvals",
                "Administrator" => "Full system access, user administration, and security governance",
                _ => $"{targetRoleName} system role"
            };

            string perms = targetRoleName switch
            {
                "Administrator" => "ALL",
                "FarmManager" => "OPERATIONS,APPROVALS,ANALYTICS_VIEW",
                "Agronomist" => "ANALYTICS_VIEW,CROPS_MANAGE",
                "FieldWorker" => "TASKS_VIEW,EVIDENCE_UPLOAD",
                "Farmer" => "FIELDS_REGISTER,SCOUTING_UPLOAD,TASKS_VIEW",
                _ => "VIEW"
            };

            role = new Role
            {
                Id = Guid.NewGuid(),
                RoleName = targetRoleName,
                Description = desc,
                PermissionsMatrix = perms
            };
            await _db.Roles.AddAsync(role);
            await _db.SaveChangesAsync();
        }

        var user = new User
        {
            Id = Guid.NewGuid(),
            Username = normalizedUsername,
            Email = normalizedEmail,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            FullName = string.IsNullOrWhiteSpace(dto.FullName) ? normalizedUsername : dto.FullName.Trim(),
            ContactNumber = dto.ContactNumber?.Trim(),
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        _db.UserRoles.Add(new UserRole { Id = Guid.NewGuid(), UserId = user.Id, RoleId = role.Id });
        var assignedRoleNames = new List<string> { role.RoleName };

        // For Administrator, also link FarmManager for operational dashboard access
        if (targetRoleName == "Administrator")
        {
            var mgrRole = await _db.Roles.FirstOrDefaultAsync(r => r.RoleName == "FarmManager");
            if (mgrRole != null)
            {
                _db.UserRoles.Add(new UserRole { Id = Guid.NewGuid(), UserId = user.Id, RoleId = mgrRole.Id });
                assignedRoleNames.Add("FarmManager");
            }
        }
        else if (targetRoleName == "FarmManager")
        {
            var mgrRole = await _db.Roles.FirstOrDefaultAsync(r => r.RoleName == "Manager");
            if (mgrRole != null)
            {
                _db.UserRoles.Add(new UserRole { Id = Guid.NewGuid(), UserId = user.Id, RoleId = mgrRole.Id });
                assignedRoleNames.Add("Manager");
            }
        }
        else if (targetRoleName == "FieldWorker")
        {
            var fwRole = await _db.Roles.FirstOrDefaultAsync(r => r.RoleName == "FarmWorker");
            if (fwRole != null)
            {
                _db.UserRoles.Add(new UserRole { Id = Guid.NewGuid(), UserId = user.Id, RoleId = fwRole.Id });
                assignedRoleNames.Add("FarmWorker");
            }

            // Also provision Worker entity for Component 2 task assignment
            var existingWorker = await _db.Workers.FirstOrDefaultAsync(w => w.UserId == user.Id);
            if (existingWorker == null)
            {
                _db.Workers.Add(new Worker
                {
                    Id = Guid.NewGuid(),
                    UserId = user.Id,
                    FullName = user.FullName,
                    ContactNumber = user.ContactNumber ?? string.Empty,
                    EmploymentType = "FullTime",
                    Status = "Active",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                });
            }
        }

        await _db.SaveChangesAsync();

        await _auditLogService.LogAsync(user.Id, "USER_REGISTERED", $"User '{user.Username}' signed up as '{targetRoleName}'.");

        var token = _tokenService.GenerateToken(user, assignedRoleNames);
        return (new AuthResponseDto(token, user.Id, user.Username, assignedRoleNames.ToArray()), null);
    }

    public async Task<(AuthResponseDto? Result, string? Error)> LoginAsync(LoginDto dto)
    {
        var normalizedUsername = dto.Username?.Trim() ?? string.Empty;
        var user = await _db.Users
            .Include(u => u.UserRoles)
            .ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(u => u.Username.ToLower() == normalizedUsername.ToLower());

        // Without signing up, signing in should not happen!
        if (user is null)
        {
            return (null, "Account not found. Please sign up first before signing in.");
        }

        if (!user.IsActive)
        {
            return (null, "This account is currently deactivated. Please contact an administrator.");
        }

        bool passwordValid = false;
        try
        {
            passwordValid = BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash);
        }
        catch
        {
            passwordValid = false;
        }

        if (!passwordValid)
        {
            await _auditLogService.LogAsync(user.Id, "USER_LOGIN_FAILED", $"Failed login attempt for username '{dto.Username}'.");
            return (null, "Invalid username or password.");
        }

        var roles = user.UserRoles
            .Where(ur => ur.Role != null)
            .Select(ur => ur.Role.RoleName)
            .Distinct()
            .ToArray();

        if (roles.Length == 0)
        {
            roles = new[] { "FarmManager" };
        }

        var token = _tokenService.GenerateToken(user, roles);

        await _auditLogService.LogAsync(user.Id, "USER_LOGIN");

        return (new AuthResponseDto(token, user.Id, user.Username, roles), null);
    }
}