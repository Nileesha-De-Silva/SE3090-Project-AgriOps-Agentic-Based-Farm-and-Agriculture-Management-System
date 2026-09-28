using AgriOpsAI.Api.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AgriOpsAI.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class RolesController : ControllerBase
{
    private readonly AgriOpsDbContext _db;

    public RolesController(AgriOpsDbContext db)
    {
        _db = db;
    }

    // Any authenticated user can see the list of valid roles (e.g. for a dropdown)
    [HttpGet]
    public async Task<IActionResult> GetRoles()
    {
        var roles = await _db.Roles
            .OrderBy(r => r.RoleName)
            .Select(r => new { r.Id, r.RoleName, r.Description })
            .ToListAsync();

        return Ok(roles);
    }
}