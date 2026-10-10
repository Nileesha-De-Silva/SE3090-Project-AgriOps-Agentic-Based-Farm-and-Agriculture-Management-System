using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using AgriOpsAI.Api.Data;
using AgriOpsAI.Api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

namespace AgriOpsAI.Api.Services;

// Separate identity: never edits existing human accounts or their roles.
public sealed class InventoryServiceIdentity(AgriOpsDbContext db, IConfiguration config)
{
    public async Task<object?> IssueAsync(string clientId, string secret, CancellationToken ct)
    {
        var expectedId = config["InventoryAgent:ClientId"];
        var expectedSecret = config["InventoryAgent:ClientSecret"];
        var key = config["Jwt:Key"];
        if (string.IsNullOrWhiteSpace(expectedId) || expectedId.Length > 50 ||
            string.IsNullOrWhiteSpace(expectedSecret) || expectedSecret.Length < 32 || expectedSecret.Length > 72 ||
            string.IsNullOrWhiteSpace(key) || Encoding.UTF8.GetByteCount(key) < 32)
            throw new InvalidOperationException("Inventory service credentials and JWT signing key must be configured.");
        if (clientId != expectedId || !CryptographicOperations.FixedTimeEquals(
            SHA256.HashData(Encoding.UTF8.GetBytes(secret)), SHA256.HashData(Encoding.UTF8.GetBytes(expectedSecret))))
            return null;

        // A database advisory lock serializes first-time provisioning across replicas.
        await using var transaction = await db.Database.BeginTransactionAsync(ct);
        await db.Database.ExecuteSqlRawAsync("SELECT pg_advisory_xact_lock(30900301)", ct);
        var user = await db.Users.Include(u => u.UserRoles).ThenInclude(r => r.Role)
            .SingleOrDefaultAsync(u => u.Username == expectedId, ct);
        if (user is null)
        {
            var role = await db.Roles.SingleOrDefaultAsync(r => r.RoleName == "InventoryAgent", ct);
            if (role is null)
            {
                role = new Role { Id = Guid.NewGuid(), RoleName = "InventoryAgent", Description = "Inventory recommendation service" };
                db.Roles.Add(role);
            }
            user = new User { Id = Guid.NewGuid(), Username = expectedId,
                Email = $"inventory-{Guid.NewGuid():N}@service.invalid", FullName = "Inventory Agent Service",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(expectedSecret), IsActive = true };
            user.UserRoles.Add(new UserRole { Id = Guid.NewGuid(), UserId = user.Id, RoleId = role.Id, Role = role });
            db.Users.Add(user);
            await db.SaveChangesAsync(ct);
        }
        if (!user.IsActive || user.UserRoles.Count != 1 || user.UserRoles.Single().Role.RoleName != "InventoryAgent" ||
            !BCrypt.Net.BCrypt.Verify(expectedSecret, user.PasswordHash))
            throw new InvalidOperationException("Inventory service account collision or credential mismatch; existing account was not changed.");
        await transaction.CommitAsync(ct);
        const int lifetime = 600;
        var token = new JwtSecurityToken(issuer: config["Jwt:Issuer"] ?? "AgriOpsAI",
            audience: config["Jwt:Audience"] ?? "AgriOpsAIUsers",
            claims: new[] { new Claim("sub", user.Id.ToString()), new Claim("jti", Guid.NewGuid().ToString()),
                new Claim(ClaimTypes.Name, user.Username), new Claim(ClaimTypes.Role, "InventoryAgent") },
            expires: DateTime.UtcNow.AddSeconds(lifetime),
            signingCredentials: new SigningCredentials(new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key)), SecurityAlgorithms.HmacSha256));
        return new InventoryServiceToken(new JwtSecurityTokenHandler().WriteToken(token), lifetime);
    }
}
public sealed record InventoryServiceToken(string AccessToken, int ExpiresIn);
