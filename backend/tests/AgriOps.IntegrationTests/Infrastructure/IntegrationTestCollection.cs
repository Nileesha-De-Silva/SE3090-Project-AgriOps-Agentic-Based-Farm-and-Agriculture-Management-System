using Xunit;

namespace AgriOps.IntegrationTests.Infrastructure;

[CollectionDefinition("IntegrationTests", DisableParallelization = true)]
public class IntegrationTestCollection : ICollectionFixture<AgriOpsTestHost>
{
}
