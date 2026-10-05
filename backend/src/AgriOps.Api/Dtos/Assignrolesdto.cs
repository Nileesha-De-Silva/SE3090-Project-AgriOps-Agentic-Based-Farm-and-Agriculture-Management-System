using System.ComponentModel.DataAnnotations;

namespace AgriOpsAI.Api.DTOs;

public class AssignRolesDto
{
    [Required, MinLength(1)]
    public List<string> RoleNames { get; set; } = new();
}