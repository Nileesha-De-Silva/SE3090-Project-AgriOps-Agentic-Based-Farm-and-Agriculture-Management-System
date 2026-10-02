using System.Net.Http;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading.Tasks;
using Microsoft.Extensions.DependencyInjection;
using AgriOps.Infrastructure.Data;
using Xunit;

namespace AgriOps.IntegrationTests.Infrastructure;

[Collection("IntegrationTests")]
public abstract class IntegrationTestBase : IAsyncLifetime
{
    protected readonly AgriOpsTestHost Host;
    protected HttpClient Client => Host.Client;

    protected static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
        Converters = { new JsonStringEnumConverter() }
    };

    protected IntegrationTestBase(AgriOpsTestHost host)
    {
        Host = host;
    }

    public virtual async Task InitializeAsync()
    {
        using var scope = Host.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        await TestDatabaseConfig.ResetDatabaseAsync(db);
    }

    public virtual Task DisposeAsync() => Task.CompletedTask;

    protected ApplicationDbContext CreateDbContext()
    {
        var scope = Host.Services.CreateScope();
        return scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    }

    protected async Task<HttpResponseMessage> PostAsJson<T>(string uri, T value)
    {
        return await Client.PostAsJsonAsync(uri, value, JsonOptions);
    }

    protected async Task<HttpResponseMessage> PutAsJson<T>(string uri, T value)
    {
        return await Client.PutAsJsonAsync(uri, value, JsonOptions);
    }

    protected async Task<HttpResponseMessage> PatchAsJson<T>(string uri, T value)
    {
        return await Client.PatchAsJsonAsync(uri, value, JsonOptions);
    }

    protected async Task<T?> GetFromJson<T>(string uri)
    {
        return await Client.GetFromJsonAsync<T>(uri, JsonOptions);
    }
}
