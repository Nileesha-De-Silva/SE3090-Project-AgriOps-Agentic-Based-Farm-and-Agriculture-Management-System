using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using AgriOpsAI.Api.Models;

namespace AgriOps.Infrastructure.Data;

public static class DbInitializer
{
    public static async Task SeedAsync(ApplicationDbContext context)
    {
        await context.Database.EnsureCreatedAsync();

        // 1. Seed Roles for RBAC Security
        var predefinedRoles = new[]
        {
            new Role
            {
                Id = Guid.Parse("11111111-1111-1111-1111-111111111111"),
                RoleName = "Administrator",
                Description = "Full system access, user administration, and security governance",
                PermissionsMatrix = "ALL"
            },
            new Role
            {
                Id = Guid.Parse("22222222-2222-2222-2222-222222222222"),
                RoleName = "FarmManager",
                Description = "Farm operations, task management, workload review, and approvals",
                PermissionsMatrix = "OPERATIONS,APPROVALS,ANALYTICS_VIEW"
            },
            new Role
            {
                Id = Guid.Parse("33333333-3333-3333-3333-333333333333"),
                RoleName = "FieldWorker",
                Description = "Mobile task execution, scouting observations, and evidence upload",
                PermissionsMatrix = "TASKS_VIEW,EVIDENCE_UPLOAD"
            },
            new Role
            {
                Id = Guid.Parse("55555555-5555-5555-5555-555555555555"),
                RoleName = "Farmer",
                Description = "Mobile field registration, crop observations, and task monitoring",
                PermissionsMatrix = "FIELDS_REGISTER,SCOUTING_UPLOAD,TASKS_VIEW"
            },
            new Role
            {
                Id = Guid.Parse("66666666-6666-6666-6666-666666666666"),
                RoleName = "Agronomist",
                Description = "Crop health analytics, historical yield evaluation, and agronomic planning",
                PermissionsMatrix = "ANALYTICS_VIEW,CROPS_MANAGE"
            },
            new Role
            {
                Id = Guid.Parse("44444444-4444-4444-4444-444444444444"),
                RoleName = "Manager",
                Description = "Manager access for inventory reorders and approvals",
                PermissionsMatrix = "MANAGER"
            },
            new Role
            {
                Id = Guid.Parse("77777777-7777-7777-7777-777777777777"),
                RoleName = "FarmWorker",
                Description = "Farm worker execution and stock usage",
                PermissionsMatrix = "TASKS_VIEW,STOCK_USE"
            }
        };

        foreach (var role in predefinedRoles)
        {
            var existingRole = await context.Roles.FirstOrDefaultAsync(r => r.Id == role.Id || r.RoleName == role.RoleName);
            if (existingRole == null)
            {
                await context.Roles.AddAsync(role);
            }
            else
            {
                existingRole.Description = role.Description;
                existingRole.PermissionsMatrix = role.PermissionsMatrix;
            }
        }
        await context.SaveChangesAsync();

        // 2. Seed Default Accounts for All 5 RBAC Roles (Password: ChangeMe123!)
        var defaultHash = "$2a$11$eAKqR/jH6QG3E3oQoM5d9.o44VlU1wW8v1uC5r7rW9W0h6L7t9XmK";

        var seedUsers = new[]
        {
            new
            {
                Id = Guid.Parse("00000000-0000-0000-0000-000000000001"),
                Username = "admin",
                Email = "admin@agriops.local",
                FullName = "System Administrator",
                Contact = "+94771234567",
                RoleIds = new[] { Guid.Parse("11111111-1111-1111-1111-111111111111"), Guid.Parse("22222222-2222-2222-2222-222222222222") }
            },
            new
            {
                Id = Guid.Parse("00000000-0000-0000-0000-000000000002"),
                Username = "farm_manager",
                Email = "farmmanager@agriops.local",
                FullName = "Nileesha (Farm Operations Manager)",
                Contact = "+94772345678",
                RoleIds = new[] { Guid.Parse("22222222-2222-2222-2222-222222222222"), Guid.Parse("44444444-4444-4444-4444-444444444444") }
            },
            new
            {
                Id = Guid.Parse("00000000-0000-0000-0000-000000000003"),
                Username = "agronomist",
                Email = "agronomist@agriops.local",
                FullName = "Dr. Perera (Crop Agronomist)",
                Contact = "+94773456789",
                RoleIds = new[] { Guid.Parse("66666666-6666-6666-6666-666666666666") }
            },
            new
            {
                Id = Guid.Parse("00000000-0000-0000-0000-000000000004"),
                Username = "field_worker",
                Email = "fieldworker@agriops.local",
                FullName = "Kasun Silva (Field Technician)",
                Contact = "+94774567890",
                RoleIds = new[] { Guid.Parse("33333333-3333-3333-3333-333333333333"), Guid.Parse("77777777-7777-7777-7777-777777777777") }
            },
            new
            {
                Id = Guid.Parse("00000000-0000-0000-0000-000000000005"),
                Username = "farmer",
                Email = "farmer@agriops.local",
                FullName = "Sunil Bandara (Farm Owner / Farmer)",
                Contact = "+94775678901",
                RoleIds = new[] { Guid.Parse("55555555-5555-5555-5555-555555555555") }
            }
        };

        foreach (var su in seedUsers)
        {
            var user = await context.Users
                .Include(u => u.UserRoles)
                .FirstOrDefaultAsync(u => u.Id == su.Id || u.Username == su.Username);

            if (user == null)
            {
                user = new User
                {
                    Id = su.Id,
                    Username = su.Username,
                    Email = su.Email,
                    PasswordHash = defaultHash,
                    FullName = su.FullName,
                    ContactNumber = su.Contact,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                await context.Users.AddAsync(user);
                await context.SaveChangesAsync();
            }
            else
            {
                user.PasswordHash = defaultHash;
                user.IsActive = true;
                user.FullName = su.FullName;
                user.Email = su.Email;
                user.ContactNumber = su.Contact;
                await context.SaveChangesAsync();
            }

            foreach (var rId in su.RoleIds)
            {
                if (!user.UserRoles.Any(ur => ur.RoleId == rId))
                {
                    await context.UserRoles.AddAsync(new UserRole
                    {
                        Id = Guid.NewGuid(),
                        UserId = user.Id,
                        RoleId = rId
                    });
                }
            }
            await context.SaveChangesAsync();
        }
    }
}
