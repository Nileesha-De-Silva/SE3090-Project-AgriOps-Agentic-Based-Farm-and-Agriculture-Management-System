namespace AgriOpsAI.Api.Services;

public static class AutomaticReorderRule
{
    public static bool IsNewMovement(Guid movement, Guid lastChecked) => movement != Guid.Empty && movement != lastChecked;
    public static bool ShouldRequest(decimal stock, decimal usage28, decimal incoming,
        DateTime createdAt, DateTime now, bool pending, bool reviewedSinceUsage) =>
        createdAt <= now.AddDays(-28) && usage28 > 0 && stock < usage28 / 2m &&
        stock + incoming < usage28 / 2m && !pending && !reviewedSinceUsage;
}

