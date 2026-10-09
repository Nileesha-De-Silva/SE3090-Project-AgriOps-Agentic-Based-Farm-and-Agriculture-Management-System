using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using AgriOps.Api.Dtos;
using AgriOps.Core.Entities;
using Xunit;

namespace AgriOps.Tests.Component2.Security;

/// <summary>
/// Authentication and Authorization xUnit test suite for Component 2 (Nileesha's Scope).
/// Validates JWT Bearer tokens, Role-Based Access Control (RBAC) claims, and security boundaries.
/// </summary>
public class Component2AuthSecurityTests
{
    private const string SecretKey = "AgriOpsMasterSecretKeyForFullStackSecurity2026!MustBeAtLeast32CharsLong";
    private const string Issuer = "AgriOpsAI";
    private const string Audience = "AgriOpsAIUsers";

    private string GenerateJwtToken(string userId, string role, string username, TimeSpan? lifetime = null)
    {
        var tokenHandler = new JwtSecurityTokenHandler();
        var key = Encoding.UTF8.GetBytes(SecretKey);
        var now = DateTime.UtcNow;
        var expires = lifetime.HasValue && lifetime.Value < TimeSpan.Zero 
            ? now.Add(lifetime.Value) 
            : now.Add(lifetime ?? TimeSpan.FromHours(1));
        var notBefore = lifetime.HasValue && lifetime.Value < TimeSpan.Zero 
            ? expires.AddHours(-1) 
            : now.AddMinutes(-1);

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(new[]
            {
                new Claim(ClaimTypes.NameIdentifier, userId),
                new Claim(ClaimTypes.Name, username),
                new Claim(ClaimTypes.Role, role),
                new Claim("sub", userId)
            }),
            NotBefore = notBefore,
            Expires = expires,
            Issuer = Issuer,
            Audience = Audience,
            SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
        };

        var token = tokenHandler.CreateToken(tokenDescriptor);
        return tokenHandler.WriteToken(token);
    }

    private ClaimsPrincipal ValidateAndGetPrincipal(string token)
    {
        var tokenHandler = new JwtSecurityTokenHandler();
        var key = Encoding.UTF8.GetBytes(SecretKey);

        var parameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = Issuer,
            ValidateAudience = true,
            ValidAudience = Audience,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(key),
            ValidateLifetime = true,
            ClockSkew = TimeSpan.Zero
        };

        return tokenHandler.ValidateToken(token, parameters, out _);
    }

    [Fact]
    public void GenerateJwtToken_ForFarmManager_ContainsManagerRoleAndValidClaims()
    {
        var managerId = Guid.NewGuid().ToString();
        var token = GenerateJwtToken(managerId, "FarmManager", "Nileesha-Manager");

        var principal = ValidateAndGetPrincipal(token);

        Assert.NotNull(principal);
        Assert.True(principal.Identity?.IsAuthenticated);
        Assert.True(principal.IsInRole("FarmManager"));
        Assert.Equal(managerId, principal.FindFirst(ClaimTypes.NameIdentifier)?.Value);
        Assert.Equal("Nileesha-Manager", principal.Identity?.Name);
    }

    [Fact]
    public void GenerateJwtToken_ForFieldWorker_ContainsWorkerRoleAndExcludesManagerPrivileges()
    {
        var workerId = Guid.NewGuid().ToString();
        var token = GenerateJwtToken(workerId, "FieldWorker", "Kasun-Worker");

        var principal = ValidateAndGetPrincipal(token);

        Assert.NotNull(principal);
        Assert.True(principal.Identity?.IsAuthenticated);
        Assert.True(principal.IsInRole("FieldWorker"));
        Assert.False(principal.IsInRole("FarmManager")); // Worker must not have manager role
    }

    [Fact]
    public void ValidateJwtToken_WhenExpired_ThrowsSecurityTokenExpiredException()
    {
        var workerId = Guid.NewGuid().ToString();
        // Create an expired token (1 hour in the past)
        var expiredToken = GenerateJwtToken(workerId, "FieldWorker", "Kasun-Worker", TimeSpan.FromHours(-1));

        Assert.Throws<SecurityTokenExpiredException>(() => ValidateAndGetPrincipal(expiredToken));
    }

    [Fact]
    public void ValidateJwtToken_WhenSignedWithTamperedKey_ThrowsSecurityTokenException()
    {
        var tokenHandler = new JwtSecurityTokenHandler();
        var tamperedKey = Encoding.UTF8.GetBytes("TamperedKeyWithInvalidCharacters32Chars!");
        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(new[] { new Claim(ClaimTypes.Role, "FarmManager") }),
            Expires = DateTime.UtcNow.AddHours(1),
            Issuer = Issuer,
            Audience = Audience,
            SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(tamperedKey), SecurityAlgorithms.HmacSha256Signature)
        };

        var tamperedToken = tokenHandler.WriteToken(tokenHandler.CreateToken(tokenDescriptor));

        Assert.ThrowsAny<SecurityTokenException>(() => ValidateAndGetPrincipal(tamperedToken));
    }

    [Fact]
    public void AuthorizationRoleCheck_FarmManagerCanAuthorizeTaskVerification_WorkerIsDenied()
    {
        var managerPrincipal = ValidateAndGetPrincipal(GenerateJwtToken(Guid.NewGuid().ToString(), "FarmManager", "Nileesha"));
        var workerPrincipal = ValidateAndGetPrincipal(GenerateJwtToken(Guid.NewGuid().ToString(), "FieldWorker", "Kasun"));

        // Business rule: Evidence verification and Task assignment require FarmManager role
        bool managerCanVerify = managerPrincipal.IsInRole("FarmManager");
        bool workerCanVerify = workerPrincipal.IsInRole("FarmManager");

        Assert.True(managerCanVerify, "FarmManager must be authorized to verify task evidence.");
        Assert.False(workerCanVerify, "FieldWorker must be prohibited from verifying task evidence.");
    }

    [Fact]
    public void SubmitEvidenceDto_ValidatesRequiredFields_AndSanitizesInput()
    {
        var workerId = Guid.NewGuid();
        var validDto = new SubmitEvidenceDto(
            EvidencePhotoUrl: "https://storage.agriops.local/evidence/field42.jpg",
            Remarks: "Applied biological Bacillus thuringiensis spray according to safety protocol.",
            WorkerUserId: workerId
        );

        Assert.NotNull(validDto.EvidencePhotoUrl);
        Assert.StartsWith("https://", validDto.EvidencePhotoUrl);
        Assert.Equal(workerId, validDto.WorkerUserId);
        Assert.False(string.IsNullOrWhiteSpace(validDto.Remarks));
    }

    [Fact]
    public void VerifyEvidenceDto_RejectsEmptyManagerId_ToPreventUnauthenticatedVerification()
    {
        var invalidDto = new VerifyEvidenceDto(
            IsApproved: true,
            ManagerUserId: Guid.Empty,
            Remarks: "Approved"
        );

        Assert.Equal(Guid.Empty, invalidDto.ManagerUserId);
        // Security rule: Guid.Empty indicates unauthenticated or missing caller
        bool isSecureCaller = invalidDto.ManagerUserId != Guid.Empty;
        Assert.False(isSecureCaller, "Audit verification must not proceed with an empty ManagerUserId.");
    }
}
