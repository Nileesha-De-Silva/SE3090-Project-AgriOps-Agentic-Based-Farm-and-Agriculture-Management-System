using System.ComponentModel.DataAnnotations;
using System.Text.Json;
using AgriOpsAI.Api.Data;
using AgriOpsAI.Api.DTOs;
using AgriOpsAI.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace AgriOpsAI.Api.Services;

public class ReorderRecommendationService(AgriOpsDbContext context)
{
    public async Task<List<ReorderRecommendationDto>> GetAllAsync()
        => (await context.ReorderRecommendations.AsNoTracking()
            .OrderByDescending(r => r.CreatedAt).ThenByDescending(r => r.Id).ToListAsync())
            .Select(ToDto).ToList();

    public async Task<ReorderRecommendationDto?> GetAsync(Guid id)
    {
        var recommendation = await context.ReorderRecommendations.AsNoTracking().SingleOrDefaultAsync(r => r.Id == id);
        return recommendation is null ? null : ToDto(recommendation);
    }

    public async Task<ReorderRecommendationDto?> CreateAsync(CreateReorderRecommendationDto dto, string actor, string issuer)
    {
        Validator.ValidateObject(dto, new ValidationContext(dto), true);
        ValidateActor(actor, issuer);
        if (dto.AgentRunId == Guid.Empty || dto.InventoryItemId == Guid.Empty || dto.SupplierId == Guid.Empty)
            throw new ValidationException("Run, inventory item and supplier IDs must not be empty.");
        var quantity = dto.RecommendedQuantity!.Value;
        if (decimal.Round(quantity, 2) != quantity)
            throw new ValidationException("Recommended quantity must have at most two decimal places.");
        await using var transaction = await context.Database.BeginTransactionAsync();
        var item = await LockItem(dto.InventoryItemId!.Value);
        if (item is null || !await context.Suppliers.AnyAsync(s => s.Id == dto.SupplierId)) return null;

        var existing = await context.ReorderRecommendations.AsNoTracking().SingleOrDefaultAsync(r =>
            r.AgentRunId == dto.AgentRunId && r.InventoryItemId == dto.InventoryItemId);
        if (existing is not null)
        {
            var savedDemand = existing.DemandSnapshotJson is null ? null : JsonSerializer.Deserialize<DemandPlanDto>(existing.DemandSnapshotJson);
            if ((savedDemand is null) != (dto.Demand is null) || (savedDemand is not null && dto.Demand is { } retry &&
                (savedDemand.SafetyDays != retry.SafetyDays || (savedDemand.Source == "manager_weekly_estimate" && savedDemand.WeeklyEstimate != retry.WeeklyEstimate) ||
                 savedDemand.UsageLast28Days != retry.ObservedUsageLast28Days || savedDemand.AsOf != retry.AsOf)))
                throw new InvalidOperationException("This agent run already submitted different demand data.");
            if (existing.SupplierId != dto.SupplierId || existing.RecommendedQuantity != quantity ||
                existing.Reason != dto.Reason.Trim() || existing.Model != dto.Model.Trim() ||
                existing.ProposedBy != actor || existing.ProposedByIssuer != issuer)
                throw new InvalidOperationException("This agent run already submitted different recommendation data.");
            return ToDto(existing);
        }
        if (await context.ReorderRecommendations.AnyAsync(r => r.InventoryItemId == item.Id && r.Status == "Pending"))
            throw new InvalidOperationException("This inventory item already has a pending recommendation.");
        if (dto.Demand is null && item.CurrentStock >= item.MinimumStockLevel)
            throw new InvalidOperationException("This inventory item is not below its minimum stock level.");
        if (item.CurrentStock + quantity > 99999999.99m)
            throw new ValidationException("Recommended quantity would exceed the stock limit.");
        var link = await LockLink(dto.SupplierId!.Value, item.Id);
        if (link is null || !link.IsAvailable)
            throw new InvalidOperationException("An available supplier-item link is required.");
        DemandPlanDto? demand = null;
        if (dto.Demand is { } demandInput)
        {
            if (dto.Observation is null) throw new ValidationException("Demand proposals require a stock and supplier observation.");
            var now = DateTime.UtcNow;
            if (demandInput.AsOf.Kind != DateTimeKind.Utc || demandInput.AsOf > now || demandInput.AsOf < now.AddDays(-1))
                throw new ValidationException("Demand evidence must be a recent UTC snapshot.");
            var usage = await Usage(item.Id, demandInput.AsOf);
            if (usage != demandInput.ObservedUsageLast28Days || await Usage(item.Id, now) != usage)
                throw new InvalidOperationException("Usage history changed. Start a fresh analysis.");
            demand = DemandPlanning.Calculate(item, usage, await Incoming(item.Id), link.LeadTimeDays, demandInput, demandInput.AsOf);
            if (!demand.ReorderNeeded || demand.Quantity != quantity)
                throw new InvalidOperationException("Demand calculation does not support this reorder quantity.");
        }
        if (dto.Observation is { } observed)
        {
            Validator.ValidateObject(observed, new ValidationContext(observed), true);
            var incoming = await context.PurchaseRequests.Where(r => r.InventoryItemId == item.Id &&
                (r.Status == "Approved" || r.Status == "Pending"))
                .SumAsync(r => (decimal?)r.RequestedQuantity) ?? 0;
            if (observed.CurrentStock != item.CurrentStock || observed.MinimumStockLevel != item.MinimumStockLevel ||
                observed.UnitOfMeasurement != item.UnitOfMeasurement || observed.UnitPrice != link.UnitPrice ||
                observed.LeadTimeDays != link.LeadTimeDays || observed.IncomingQuantity != incoming)
                throw new InvalidOperationException("Agent evidence changed during analysis. Start a fresh analysis.");
        }
        var recommendation = new ReorderRecommendation
        {
            Id = Guid.NewGuid(), AgentRunId = dto.AgentRunId!.Value, Model = dto.Model.Trim(),
            ProposedBy = actor, ProposedByIssuer = issuer, InventoryItemId = item.Id,
            SupplierId = dto.SupplierId.Value, RecommendedQuantity = quantity, Reason = dto.Reason.Trim(),
            StockAtProposal = item.CurrentStock, MinimumStockAtProposal = item.MinimumStockLevel,
            DemandSnapshotJson = demand is null ? null : JsonSerializer.Serialize(demand),
            UnitOfMeasurement = item.UnitOfMeasurement, UnitPrice = link.UnitPrice, LeadTimeDays = link.LeadTimeDays,
            Status = "Pending", CreatedAt = DateTime.UtcNow
        };
        context.ReorderRecommendations.Add(recommendation);
        await context.SaveChangesAsync();
        await transaction.CommitAsync();
        return ToDto(recommendation);
    }

    public async Task<ReorderRecommendationDto?> DecideAsync(Guid id, bool approve,
        RecommendationDecisionDto dto, string actor, string issuer)
    {
        Validator.ValidateObject(dto, new ValidationContext(dto), true);
        ValidateActor(actor, issuer);
        await using var transaction = await context.Database.BeginTransactionAsync();
        var records = await context.ReorderRecommendations.FromSqlInterpolated($"""
            SELECT * FROM "ReorderRecommendations" WHERE "Id" = {id} FOR UPDATE
            """).AsTracking().ToListAsync();
        var recommendation = records.SingleOrDefault();
        if (recommendation is null) return null;
        var desiredStatus = approve ? "Approved" : "Rejected";
        if (recommendation.Status == desiredStatus) return ToDto(recommendation);
        if (recommendation.Status != "Pending")
            throw new InvalidOperationException("This recommendation already has a different decision.");
        var now = DateTime.UtcNow;
        if (approve)
        {
            var item = await LockItem(recommendation.InventoryItemId);
            var link = await LockLink(recommendation.SupplierId, recommendation.InventoryItemId);
            if (item is null || link is null || !link.IsAvailable ||
                item.CurrentStock != recommendation.StockAtProposal ||
                item.MinimumStockLevel != recommendation.MinimumStockAtProposal ||
                item.UnitOfMeasurement != recommendation.UnitOfMeasurement ||
                link.UnitPrice != recommendation.UnitPrice || link.LeadTimeDays != recommendation.LeadTimeDays)
                throw new InvalidOperationException("Stock or supplier details changed. Reject this recommendation and request a fresh analysis.");
            if (recommendation.DemandSnapshotJson is { } json)
            {
                var saved = JsonSerializer.Deserialize<DemandPlanDto>(json)!;
                var usage = await Usage(item.Id, now);
                var incoming = await Incoming(item.Id);
                if (usage != saved.UsageLast28Days || incoming != saved.IncomingQuantity)
                    throw new InvalidOperationException("Demand or incoming orders changed. Reject this recommendation and request a fresh analysis.");
                var fresh = DemandPlanning.Calculate(item, usage, incoming, link.LeadTimeDays,
                    new DemandRequestDto { SafetyDays = saved.SafetyDays, WeeklyEstimate = saved.WeeklyEstimate,
                        ObservedUsageLast28Days = usage, AsOf = now }, now);
                if (fresh.Source != saved.Source || !fresh.ReorderNeeded || fresh.Quantity != saved.Quantity || fresh.ReorderPoint != saved.ReorderPoint)
                    throw new InvalidOperationException("Demand or incoming orders changed. Reject this recommendation and request a fresh analysis.");
            }
            var request = new PurchaseRequest
            {
                Id = Guid.NewGuid(), InventoryItemId = recommendation.InventoryItemId,
                SupplierId = recommendation.SupplierId, RequestedQuantity = recommendation.RecommendedQuantity,
                Reason = recommendation.Reason, Status = "Approved", ApprovedAt = now,
                RequestedAt = now, CreatedAt = now, UpdatedAt = now
            };
            context.PurchaseRequests.Add(request);
            recommendation.PurchaseRequest = request;
            recommendation.PurchaseRequestId = request.Id;
        }
        recommendation.Status = desiredStatus;
        recommendation.DecidedAt = now;
        recommendation.DecidedBy = actor;
        recommendation.DecidedByIssuer = issuer;
        recommendation.DecisionNote = string.IsNullOrWhiteSpace(dto.Note) ? null : dto.Note.Trim();
        // Decision and resulting purchase request commit together, or neither does.
        await context.SaveChangesAsync();
        await transaction.CommitAsync();
        return ToDto(recommendation);
    }

    private Task<decimal> Incoming(Guid id) => context.PurchaseRequests
        .Where(r => r.InventoryItemId == id && (r.Status == "Pending" || r.Status == "Approved"))
        .SumAsync(r => r.RequestedQuantity);

    private Task<decimal> Usage(Guid id, DateTime asOf)
    {
        var start = asOf.AddDays(-28);
        return context.InventoryTransactions.Where(t => t.InventoryItemId == id && t.TransactionType == "Use" &&
            t.TransactionDate >= start && t.TransactionDate <= asOf).SumAsync(t => t.Quantity);
    }

    private async Task<InventoryItem?> LockItem(Guid id)
        => (await context.InventoryItems.FromSqlInterpolated($"""
            SELECT * FROM "InventoryItems" WHERE "Id" = {id} FOR UPDATE
            """).AsTracking().ToListAsync()).SingleOrDefault();

    private async Task<SupplierItem?> LockLink(Guid supplierId, Guid itemId)
        => (await context.SupplierItems.FromSqlInterpolated($"""
            SELECT * FROM "SupplierItems" WHERE "SupplierId" = {supplierId}
            AND "InventoryItemId" = {itemId} FOR UPDATE
            """).AsTracking().ToListAsync()).SingleOrDefault();

    private static void ValidateActor(string actor, string issuer)
    {
        if (string.IsNullOrWhiteSpace(actor) || actor.Length > 200 || string.IsNullOrWhiteSpace(issuer) || issuer.Length > 500)
            throw new ValidationException("A valid authenticated subject and issuer are required.");
    }

    private static ReorderRecommendationDto ToDto(ReorderRecommendation r) => new()
    {
        Demand = r.DemandSnapshotJson is null ? null : JsonSerializer.Deserialize<DemandPlanDto>(r.DemandSnapshotJson),
        Id = r.Id, AgentRunId = r.AgentRunId, Model = r.Model, InventoryItemId = r.InventoryItemId,
        SupplierId = r.SupplierId, RecommendedQuantity = r.RecommendedQuantity, Reason = r.Reason,
        StockAtProposal = r.StockAtProposal, MinimumStockAtProposal = r.MinimumStockAtProposal,
        UnitOfMeasurement = r.UnitOfMeasurement, UnitPrice = r.UnitPrice, LeadTimeDays = r.LeadTimeDays,
        EstimatedCost = decimal.Round(r.UnitPrice * r.RecommendedQuantity, 2, MidpointRounding.AwayFromZero),
        Status = r.Status, CreatedAt = r.CreatedAt, DecidedAt = r.DecidedAt, DecidedBy = r.DecidedBy,
        DecidedByIssuer = r.DecidedByIssuer, DecisionNote = r.DecisionNote, PurchaseRequestId = r.PurchaseRequestId
    };
}
