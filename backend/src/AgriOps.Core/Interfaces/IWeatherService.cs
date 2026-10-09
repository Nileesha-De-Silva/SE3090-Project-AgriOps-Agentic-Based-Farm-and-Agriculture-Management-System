using System.Collections.Generic;
using System.Threading.Tasks;

namespace AgriOps.Core.Interfaces;

public record WeatherForecastDayDto(
    string Date,
    double MaxTempCelsius,
    double MinTempCelsius,
    int RainProbabilityPercent,
    string Condition
);

public record WeatherDataDto(
    string LocationName,
    double Latitude,
    double Longitude,
    double TemperatureCelsius,
    int RainProbabilityPercent,
    int HumidityPercent,
    double WindSpeedKmh,
    string WindDirection,
    string ConditionDescription,
    bool IsRainForecasted,
    List<WeatherForecastDayDto> ForecastDays
);

public interface IWeatherService
{
    Task<WeatherDataDto> GetCurrentAndForecastWeatherAsync(double latitude = 6.9271, double longitude = 79.8612);
}
