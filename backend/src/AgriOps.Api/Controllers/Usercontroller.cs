using System.IdentityModel.Tokens.Jwt;
using AgriOpsAI.Api.Data;
using AgriOpsAI.Api.DTOs;
using AgriOpsAI.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AgriOpsAI.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class UsersController : ControllerBase
{
    private readonly AgriOpsDbContext _db;

    public UsersController(AgriOpsDbContext db)
    {
        _db = db;
    }

    // GET /api/users - Administrators only: every user with their roles
    [HttpGet]
    [Authorize(Roles = "Administrator")]
    public async Task<IActionResult> GetUsers([FromQuery] int skip = 0, [FromQuery] int take = 50)
    {
        var users = await _db.Users
            .Include(u => u.UserRoles).ThenInclude(ur => ur.Role)
            .OrderBy(u => u.Username)
            .Skip(skip)
            .Take(Math.Min(take, 200))
            .Select(u => new UserSummaryDto(
                u.Id, u.Username, u.Email, u.FullName, u.ContactNumber, u.IsActive, u.CreatedAt,
                u.UserRoles.Select(ur => ur.Role.RoleName)))
            .ToListAsync();

        return Ok(users);
    }

    // GET /api/users/me - any authenticated user: their own profile
    [HttpGet("me")]
    public async Task<IActionResult> GetMe()
    {
        var userId = GetCurrentUserId();
        if (userId is null) return Unauthorized();

        var user = await _db.Users
            .Include(u => u.UserRoles).ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (user is null) return NotFound();

        return Ok(new UserSummaryDto(
            user.Id, user.Username, user.Email, user.FullName, user.ContactNumber, user.IsActive, user.CreatedAt,
            user.UserRoles.Select(ur => ur.Role.RoleName)));
    }

    // GET /api/users/{id} - Administrators only
    [HttpGet("{id:guid}")]
    [Authorize(Roles = "Administrator")]
    public async Task<IActionResult> GetUser(Guid id)
    {
        var user = await _db.Users
            .Include(u => u.UserRoles).ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(u => u.Id == id);

        if (user is null) return NotFound();

        return Ok(new UserSummaryDto(
            user.Id, user.Username, user.Email, user.FullName, user.ContactNumber, user.IsActive, user.CreatedAt,
            user.UserRoles.Select(ur => ur.Role.RoleName)));
    }

    // PUT /api/users/{id}/status?isActive=false - Administrators only.
    // Soft delete rather than a hard DELETE: other components (Farm.OwnerId,
    // Harvest.RecordedByUserId) reference user IDs, so removing rows outright
    // would break those references and lose audit history.
    [HttpPut("{id:guid}/status")]
    [Authorize(Roles = "Administrator")]
    public async Task<IActionResult> SetStatus(Guid id, [FromQuery] bool isActive)
    {
        var user = await _db.Users.FindAsync(id);
        if (user is null) return NotFound();

        user.IsActive = isActive;
        user.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(); // AuditLogInterceptor logs this as USER_UPDATED automatically

        return NoContent();
    }

    // DELETE /api/users/{id} - Administrators only: permanently removes user from database existence
    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Administrator")]
    public async Task<IActionResult> DeleteUser(Guid id)
    {
        var currentUserId = GetCurrentUserId();
        if (currentUserId.HasValue && currentUserId.Value == id)
        {
            return BadRequest(new { message = "You cannot delete your own logged-in administrator account." });
        }

        var user = await _db.Users
            .Include(u => u.UserRoles)
            .FirstOrDefaultAsync(u => u.Id == id);

        if (user is null) return NotFound();

        // 1. Remove associated UserRoles
        if (user.UserRoles.Any())
        {
            _db.UserRoles.RemoveRange(user.UserRoles);
        }

        // 2. Unlink or remove associated Worker profiles
        var workers = await _db.Workers.Where(w => w.UserId == id).ToListAsync();
        foreach (var worker in workers)
        {
            var skills = await _db.WorkerSkills.Where(ws => ws.WorkerId == worker.Id).ToListAsync();
            if (skills.Any()) _db.WorkerSkills.RemoveRange(skills);

            var assignments = await _db.TaskAssignments.Where(ta => ta.WorkerId == worker.Id).ToListAsync();
            if (assignments.Any()) _db.TaskAssignments.RemoveRange(assignments);

            _db.Workers.Remove(worker);
        }

        // 3. Nullify or clean references in AuditLogs so foreign key constraint is satisfied
        var auditLogs = await _db.AuditLogs.Where(a => a.UserId == id).ToListAsync();
        foreach (var log in auditLogs)
        {
            log.UserId = null;
        }

        // 4. Permanently remove the user from the database
        _db.Users.Remove(user);
        await _db.SaveChangesAsync();

        return Ok(new 
        { 
            message = $"User '{user.Username}' has been permanently deleted from the database.",
            deletedUserId = id,
            deletedUsername = user.Username 
        });
    }

    // PUT /api/users/{id}/roles - Administrators only: replace a user's role set entirely
    [HttpPut("{id:guid}/roles")]
    [Authorize(Roles = "Administrator")]
    public async Task<IActionResult> SetRoles(Guid id, AssignRolesDto dto)
    {
        var user = await _db.Users
            .Include(u => u.UserRoles)
            .FirstOrDefaultAsync(u => u.Id == id);

        if (user is null) return NotFound();

        var roles = await _db.Roles
            .Where(r => dto.RoleNames.Contains(r.RoleName))
            .ToListAsync();

        if (roles.Count != dto.RoleNames.Distinct().Count())
            return BadRequest(new { message = "One or more role names are invalid." });

        _db.UserRoles.RemoveRange(user.UserRoles);
        foreach (var role in roles)
        {
            _db.UserRoles.Add(new UserRole { Id = Guid.NewGuid(), UserId = user.Id, RoleId = role.Id });
        }

        user.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(); // AuditLogInterceptor logs the UserRole adds/removes automatically

        return NoContent();
    }

    private Guid? GetCurrentUserId()
    {
        // "User" here is ControllerBase's ClaimsPrincipal property, not the
        // AgriOpsAI.Api.Models.User entity - C# resolves the class member first.
        var sub = User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value
               ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        return Guid.TryParse(sub, out var id) ? id : null;
    }
}