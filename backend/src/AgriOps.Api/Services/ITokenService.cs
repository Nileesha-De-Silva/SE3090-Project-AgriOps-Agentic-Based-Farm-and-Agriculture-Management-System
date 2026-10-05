using AgriOpsAI.Api.Models;

namespace AgriOpsAI.Api.Services;

public interface ITokenService
{
    string GenerateToken(User user, IEnumerable<string> roles);
}