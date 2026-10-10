using AgriOpsAI.Api.Services;
var now = DateTime.UtcNow;
var count = 0;
void Check(bool condition, string label) { if (!condition) throw new Exception(label); count++; }
bool Rule(decimal stock, decimal usage = 40m, decimal incoming = 0m, int age = 28, bool pending = false, bool reviewed = false)
    => AutomaticReorderRule.ShouldRequest(stock, usage, incoming, now.AddDays(-age), now, pending, reviewed);
Check(Rule(19.99m), "Below two weeks triggers");
Check(!Rule(20m), "Equality must not trigger");
Check(!Rule(21m), "Above threshold must not trigger");
Check(!Rule(0m, usage: 0m), "Zero usage must not trigger");
Check(!Rule(10m, age: 27), "Insufficient history must not trigger");
Check(!Rule(10m, pending: true), "Pending proposal suppresses duplicate");
Check(!Rule(10m, reviewed: true), "Decision after usage suppresses repeat");
Check(!Rule(10m, incoming: 10m), "Incoming stock covering threshold suppresses proposal");
Check(Rule(10m, incoming: 9.99m), "Partial incoming stock can still require reorder");
var movement = Guid.NewGuid();
Check(AutomaticReorderRule.IsNewMovement(movement, Guid.Empty), "First movement triggers a check");
Check(!AutomaticReorderRule.IsNewMovement(movement, movement), "Unchanged movement must not retrigger");
Check(AutomaticReorderRule.IsNewMovement(Guid.NewGuid(), movement), "New receipt or usage allows a check");
Check(!AutomaticReorderRule.IsNewMovement(Guid.Empty, Guid.Empty), "No movement must not trigger");
Console.WriteLine($"{count} automatic reorder rule checks passed.");
