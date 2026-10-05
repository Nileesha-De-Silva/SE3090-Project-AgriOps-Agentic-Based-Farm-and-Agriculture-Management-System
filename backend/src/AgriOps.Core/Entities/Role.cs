using System.ComponentModel.DataAnnotations;

namespace AgriOpsAI.Api.Models
{
    public class Role
    {
        [Key]
        public Guid Id { get; set; }

        // Expected values: Farmer, FarmWorker, FarmManager, Administrator
        [Required, MaxLength(50)]
        public string RoleName { get; set; } = string.Empty;

        [MaxLength(250)]
        public string? Description { get; set; }

        // Stored as a JSON string (e.g. {"canApprove":true,"canManageUsers":false}),
        // parse/serialize it in a service rather than the model itself.
        public string? PermissionsMatrix { get; set; }

        public ICollection<UserRole> UserRoles { get; set; } = new List<UserRole>();
    }
}