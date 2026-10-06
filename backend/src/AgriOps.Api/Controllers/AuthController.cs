using AgriOpsAI.Api.DTOs;
using AgriOpsAI.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AgriOpsAI.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    [AllowAnonymous]
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var (result, error) = await _authService.LoginAsync(dto);
        if (error is not null)
            return Unauthorized(new { message = error });

        return Ok(result);
    }

    [Authorize(Roles = "Administrator")]
    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var (result, error) = await _authService.RegisterAsync(dto);
        if (error is not null)
            return BadRequest(new { message = error });

        return Ok(result);
    }
}
