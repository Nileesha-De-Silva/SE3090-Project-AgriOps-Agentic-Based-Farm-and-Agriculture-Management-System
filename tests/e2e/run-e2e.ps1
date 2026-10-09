# AgriOps Component 2 - End-to-End Test Suite Runner
# Executes the Postman E2E collection against local or CI backend using Newman

param (
    [string]$BaseUrl = "http://localhost:5000",
    [switch]$HtmlReport
)

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$collection = Join-Path $scriptDir "AgriOps_Component2_E2E.postman_collection.json"
$envFile = Join-Path $scriptDir "AgriOps_Component2.postman_environment.json"

Write-Host "==========================================================" -ForegroundColor Green
Write-Host " AgriOps Component 2 - E2E & Cross-Platform Test Runner   " -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "Target Base URL: $BaseUrl" -ForegroundColor Cyan
Write-Host "Collection:     $collection" -ForegroundColor Cyan

$newmanArgs = @(
    "run",
    "`"$collection`"",
    "-e", "`"$envFile`"",
    "--env-var", "baseUrl=$BaseUrl",
    "--reporters", "cli"
)

if ($HtmlReport) {
    $reportPath = Join-Path $scriptDir "reports/e2e-report.html"
    $newmanArgs += @("--reporters", "cli,htmlextra", "--reporter-htmlextra-export", "`"$reportPath`"")
    Write-Host "HTML report will be generated at: $reportPath" -ForegroundColor Yellow
}

Write-Host "`nExecuting Newman E2E Suite..." -ForegroundColor Cyan
npx --yes newman @newmanArgs
