using System.ComponentModel.DataAnnotations;

namespace AgriOpsAI.Api.DTOs;

public class RegisterDto
{
    [Required, MaxLength(50)]
    public string Username { get; set; } = string.Empty;

    [Required, EmailAddress, MaxLength(150)]
    public string Email { get; set; } = string.Empty;

    [Required, MinLength(8)]
    public string Password { get; set; } = string.Empty;

    [Required, MaxLength(100)]
    public string FullName { get; set; } = string.Empty;

    [MaxLength(20)]
    public string? ContactNumber { get; set; }

    // Must match an existing Role.RoleName exactly
    // (seeded on startup: "Farmer", "FarmWorker", "FarmManager", "Administrator")
    [Required]
    public string RoleName { get; set; } = string.Empty;
}