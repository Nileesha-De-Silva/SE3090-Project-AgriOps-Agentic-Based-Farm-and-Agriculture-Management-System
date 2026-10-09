using System.ComponentModel.DataAnnotations;
using AgriOpsAI.Api.DTOs;
using AgriOpsAI.Api.Models;

namespace AgriOpsAI.Api.Services;

// Keep quantities deterministic. The model selects an offer; it never calculates stock.
public static class DemandPlanning
{
    public static decimal Up(decimal value) => decimal.Ceiling(value * 100m) / 100m;
    public static DemandPlanDto Calculate(InventoryItem item, decimal usage, decimal incoming,
        int leadDays, DemandRequestDto input, DateTime now)
    {
        Validator.ValidateObject(input, new ValidationContext(input), true);
        if (input.WeeklyEstimate is { } estimate && decimal.Round(estimate, 2) != estimate)
            throw new ValidationException("Weekly estimate must have at most two decimal places.");
        var historical = item.CreatedAt <= now.AddDays(-28) && usage > 0;
        if (!historical && input.WeeklyEstimate is null)
            throw new ValidationException("A weekly estimate is required until 28 days of usable history are available.");
        // Multiply before dividing to avoid rounding a recurring daily rate prematurely.
        var amount = historical ? usage : input.WeeklyEstimate!.Value;
        var divisor = historical ? 28m : 7m;
        var reorder = Math.Max(item.MinimumStockLevel, Up(amount * (leadDays + (decimal)input.SafetyDays) / divisor));
        var target = Math.Max(item.MinimumStockLevel, Up(amount * (Math.Max(30, leadDays) + (decimal)input.SafetyDays) / divisor));
        if (target > 99999999.99m) throw new ValidationException("Demand target exceeds the stock limit.");
        var quantity = Math.Max(0, target - item.CurrentStock - incoming);
        return new DemandPlanDto
        {
            AsOf = now, UsageLast28Days = usage, IncomingQuantity = incoming,
            WeeklyEstimate = historical ? null : input.WeeklyEstimate, SafetyDays = input.SafetyDays,
            Source = historical ? "recorded_28_days" : "manager_weekly_estimate",
            AverageWeeklyUsage = Up(amount * 7 / divisor), MonthlyUsage = Up(amount * 30 / divisor),
            SafetyStock = Up(amount * input.SafetyDays / divisor), ReorderPoint = reorder,
            TargetStock = target, Quantity = quantity,
            ReorderNeeded = item.CurrentStock <= reorder && quantity > 0,
            ShortageRisk = item.CurrentStock * divisor < amount * leadDays
        };
    }
}
