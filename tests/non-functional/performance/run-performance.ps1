# AgriOps Component 2 - Performance & Load Test Runner
param (
    [string]$BaseUrl = "http://localhost:5000",
    [ValidateSet("load", "stress")][string]$Mode = "load"
)

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$script = if ($Mode -eq "stress") { Join-Path $scriptDir "k6-stress-test.js" } else { Join-Path $scriptDir "k6-load-test.js" }

Write-Host "==========================================================" -ForegroundColor Green
Write-Host " AgriOps Component 2 - k6 Performance Benchmark Runner    " -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "Target Base URL: $BaseUrl" -ForegroundColor Cyan
Write-Host "Test Mode:       $Mode ($script)" -ForegroundColor Cyan

# Check if k6 is installed
$k6Installed = Get-Command k6 -ErrorAction SilentlyContinue

if ($k6Installed) {
    Write-Host "`nExecuting k6 with target $BaseUrl..." -ForegroundColor Yellow
    k6 run -e BASE_URL=$BaseUrl $script
} else {
    Write-Host "`nk6 is not locally installed. Running in Docker or standalone mode." -ForegroundColor Yellow
    Write-Host "To execute in Docker:" -ForegroundColor Cyan
    Write-Host "docker run --rm -i -e BASE_URL=$BaseUrl grafana/k6 run - < $script" -ForegroundColor White
    Write-Host "`nAlternatively, use the automated C# performance test suite:" -ForegroundColor Cyan
    Write-Host "dotnet test backend/tests/AgriOps.IntegrationTests --filter `"Category=Performance`"" -ForegroundColor White
}
