namespace AgriOpsAI.Api.DTOs;

public record SeasonYieldDto(
    Guid FieldId,
    string FieldName,
    Guid CropSeasonId,
    string SeasonName,
    DateTime StartDate,
    string CropName,
    decimal TotalYield);