using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AgriOpsAI.Api.Models
{
    public class AuditLog
    {
        [Key]
        public Guid Id { get; set; }

        // Nullable: some entries (e.g. automated system actions) may have no user
        [ForeignKey(nameof(User))]
        public Guid? UserId { get; set; }
        public User? User { get; set; }

        // e.g. USER_LOGIN, CONFIG_UPDATE, ROLE_REVOKED
        [Required, MaxLength(50)]
        public string ActionType { get; set; } = string.Empty;

        [MaxLength(45)]
        public string? IpAddress { get; set; }

        // Free-form JSON blob describing what changed (before/after values)
        public string? Details { get; set; }

        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    }
}