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

    public string? Role { get; set; }

    private string? _roleName;
    public string RoleName
    {
        get => !string.IsNullOrWhiteSpace(_roleName) ? _roleName : (Role ?? string.Empty);
        set => _roleName = value;
    }
}