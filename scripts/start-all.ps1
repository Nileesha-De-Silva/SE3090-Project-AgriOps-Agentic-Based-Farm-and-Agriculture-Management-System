# ==============================================================================
# AgriOps AI - Full-Stack Local Launcher (Single Terminal Orchestrator)
# ==============================================================================
# This script starts all backend, frontend, and AI agent services in the background
# and tracks their process IDs. Press [Ctrl + C] or type 'q' to stop everything.
# ==============================================================================

$ErrorActionPreference = "Continue"
$Root = Split-Path -Parent $PSScriptRoot

Write-Host "==================================================================" -ForegroundColor Cyan
Write-Host "      Starting AgriOps AI Full-Stack System (Single Terminal)    " -ForegroundColor Green
Write-Host "==================================================================" -ForegroundColor Cyan

$processes = @()
$venvPython = Join-Path $Root ".venv\Scripts\python.exe"

# Function to safely start a service
function Start-ServiceProcess {
    param (
        [string]$Name,
        [string]$WorkingDir,
        [string]$Command,
        [string]$Arguments,
        [int]$Port
    )
    Write-Host "[Starting] $Name on port $Port..." -ForegroundColor Yellow
    $p = Start-Process -FilePath $Command -ArgumentList $Arguments -WorkingDirectory $WorkingDir -PassThru -NoNewWindow
    return [PSCustomObject]@{
        Name = $Name
        Port = $Port
        Process = $p
    }
}

try {
    # 1. Start ASP.NET Core Backend
    $backendDir = Join-Path $Root "backend\src\AgriOps.Api"
    $processes += Start-ServiceProcess -Name "ASP.NET Core Backend API" -WorkingDir $backendDir -Command "dotnet" -Arguments "run --no-launch-profile" -Port 5286

    # 2. Start Agent 2: Crop Health & Disease Agent
    $agent2Dir = Join-Path $Root "ai-subsystem"
    $processes += Start-ServiceProcess -Name "Agent 2: Crop Health AI" -WorkingDir $agent2Dir -Command $venvPython -Arguments "-m uvicorn main:app --port 8000 --host 127.0.0.1" -Port 8000

    # 3. Start Agent 1: Farm Planning Agent
    $agent1Dir = Join-Path $Root "agents\farm-planning-agent"
    $processes += Start-ServiceProcess -Name "Agent 1: Farm Planning AI" -WorkingDir $agent1Dir -Command $venvPython -Arguments "-m uvicorn app.main:app --port 8001 --host 127.0.0.1" -Port 8001

    # 4. Start Agent 3: Inventory Reorder Agent
    $agent3Dir = Join-Path $Root "agents\inventory-agent"
    $processes += Start-ServiceProcess -Name "Agent 3: Inventory AI" -WorkingDir $agent3Dir -Command $venvPython -Arguments "-m uvicorn app.main:app --port 8003 --host 127.0.0.1" -Port 8003

    # 5. Start React Web Dashboard
    $webDir = Join-Path $Root "frontend-web"
    $processes += Start-ServiceProcess -Name "React Web Dashboard" -WorkingDir $webDir -Command "npm.cmd" -Arguments "run dev" -Port 5173

    Write-Host ""
    Write-Host "==================================================================" -ForegroundColor Green
    Write-Host " All services launched successfully!" -ForegroundColor Green
    Write-Host " - Web Dashboard:       http://localhost:5173" -ForegroundColor White
    Write-Host " - Backend Swagger API: http://localhost:5286/swagger" -ForegroundColor White
    Write-Host " - Backend Health Check:http://localhost:5286/health" -ForegroundColor White
    Write-Host " - Agent 2 (Health):    http://localhost:8000/docs" -ForegroundColor White
    Write-Host " - Agent 1 (Planning):  http://localhost:8001/docs" -ForegroundColor White
    Write-Host " - Agent 3 (Inventory): http://localhost:8003/docs" -ForegroundColor White
    Write-Host "==================================================================" -ForegroundColor Green
    Write-Host "Press [Q] or [Ctrl + C] at any time to stop ALL services..." -ForegroundColor Magenta

    while ($true) {
        if ([Console]::KeyAvailable) {
            $key = [Console]::ReadKey($true)
            if ($key.Key -eq [ConsoleKey]::Q) {
                break
            }
        }
        Start-Sleep -Seconds 1
    }
}
finally {
    Write-Host "`nStopping all AgriOps services..." -ForegroundColor Yellow
    foreach ($item in $processes) {
        if ($item.Process -and !$item.Process.HasExited) {
            Write-Host "Stopping $($item.Name) (PID: $($item.Process.Id))..." -ForegroundColor Gray
            Stop-Process -Id $item.Process.Id -Force -ErrorAction SilentlyContinue
        }
    }
    # Also clean up any lingering node or dotnet instances launched
    Write-Host "All services stopped." -ForegroundColor Green
}
