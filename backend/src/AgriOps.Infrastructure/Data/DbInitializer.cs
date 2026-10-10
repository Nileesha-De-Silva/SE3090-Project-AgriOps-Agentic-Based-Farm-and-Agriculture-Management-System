using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using AgriOpsAI.Api.Models;
using AgriOps.Core.Entities;

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

        var resolvedRoles = new Dictionary<Guid, Role>();
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
            // Existing databases may use different IDs for these role names.
            resolvedRoles.Add(role.Id, existingRole ?? role);
        }
        await context.SaveChangesAsync();

        // 2. Seed Default Accounts for All 5 RBAC Roles (Password: ChangeMe123!)
        var defaultHash = "$2a$11$XsAlnYqCGzO/AN8vgvZN4uQBwXO5AND2GhL6WaKghQrJfgOzPrecq";

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

            foreach (var seedRoleId in su.RoleIds)
            {
                var rId = resolvedRoles[seedRoleId].Id;
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

        // 3. Seed Default Agricultural Crops
        if (!await context.Crops.AnyAsync())
        {
            var predefinedCrops = new[]
            {
                new Crop
                {
                    Id = Guid.Parse("90093121-64ab-47a2-b991-4be01f3c473b"),
                    CropName = "Tomato",
                    Variety = "Roma Hybrid",
                    OptimalGrowthDurationDays = 90,
                    Description = "Determinate red tomato for field and plot production"
                },
                new Crop
                {
                    Id = Guid.Parse("50b6a719-01b0-4453-876e-0f357e19a227"),
                    CropName = "Bell Pepper",
                    Variety = "California Wonder",
                    OptimalGrowthDurationDays = 75,
                    Description = "Sweet bell pepper suited for sandy loam and irrigated plots"
                },
                new Crop
                {
                    Id = Guid.Parse("cb41297f-2410-4833-8eac-5950542083af"),
                    CropName = "Chili Pepper",
                    Variety = "Hot Pepper MICH 1",
                    OptimalGrowthDurationDays = 120,
                    Description = "Pungent hot chili variety for central province cultivation"
                },
                new Crop
                {
                    Id = Guid.Parse("0b1bee35-9458-43fb-a5c8-a009031c6b0b"),
                    CropName = "Paddy (Rice)",
                    Variety = "BG 352",
                    OptimalGrowthDurationDays = 105,
                    Description = "High-yield wetland rice variety"
                },
                new Crop
                {
                    Id = Guid.Parse("853e344d-cf4f-4b46-886a-c3d92bf46f55"),
                    CropName = "Corn (Maize)",
                    Variety = "Pacific 999 Hybrid",
                    OptimalGrowthDurationDays = 110,
                    Description = "Commercial grain and sweet corn hybrid"
                }
            };

            await context.Crops.AddRangeAsync(predefinedCrops);
            await context.SaveChangesAsync();
        }
    }
}
