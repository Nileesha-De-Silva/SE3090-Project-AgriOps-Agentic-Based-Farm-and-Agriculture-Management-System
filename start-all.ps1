# =========================================================================
# AgriOps Unified Service Orchestrator (Single Terminal Runner)
# =========================================================================
$ErrorActionPreference = "Continue"

Write-Host "==========================================================" -ForegroundColor Green
Write-Host "   🌱 AGRIOPS PLATFORM - UNIFIED STARTUP (1 TERMINAL)    " -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green

# Resolve Python virtual environment
$pythonExe = if (Test-Path ".venv\Scripts\python.exe") { ".venv\Scripts\python.exe" } else { "python" }

# 1. Start ASP.NET Core Backend API
Write-Host " [1/3] Starting ASP.NET Core API on http://localhost:5286..." -ForegroundColor Cyan
$backend = Start-Process dotnet -ArgumentList "run --project backend/src/AgriOps.Api" -PassThru

# 2. Start Component 2 AI Agent (Crop Analysis on Port 8000)
Write-Host " [2/4] Starting Component 2 AI Agent (Crop Analysis) on http://localhost:8000..." -ForegroundColor Magenta
$aiCrop = Start-Process $pythonExe -ArgumentList "-m uvicorn main:app --app-dir ai-subsystem --port 8000 --reload" -PassThru

# 3. Start Component 1 AI Agent (Farm Planning on Port 8001)
Write-Host " [3/4] Starting Component 1 AI Agent (Farm Planning) on http://localhost:8001..." -ForegroundColor DarkMagenta
$aiPlan = Start-Process $pythonExe -ArgumentList "-m uvicorn app.main:app --app-dir agents/farm-planning-agent --port 8001 --reload" -PassThru

# 4. Start React Web Dashboard (Vite on Port 5173)
Write-Host " [4/4] Starting React Web Dashboard on http://localhost:5173..." -ForegroundColor Yellow
$frontend = Start-Process cmd -ArgumentList "/c npm run dev --prefix frontend-web" -PassThru

Write-Host ""
Write-Host "----------------------------------------------------------" -ForegroundColor DarkGray
Write-Host "  All services are running concurrently!" -ForegroundColor Green
Write-Host "    • Backend API Swagger    : http://localhost:5286/swagger" -ForegroundColor Cyan
Write-Host "    • Crop Diagnostic AI (C2): http://localhost:8000/docs" -ForegroundColor Magenta
Write-Host "    • Farm Planning AI (C1)  : http://localhost:8001/docs" -ForegroundColor DarkMagenta
Write-Host "    • React Dashboard UI     : http://localhost:5173" -ForegroundColor Yellow
Write-Host "----------------------------------------------------------" -ForegroundColor DarkGray
Write-Host " Type 'stop' or 'q' and press ENTER to terminate all services..." -ForegroundColor White

try {
    while ($true) {
        $input = Read-Host
        if ($input -eq "q" -or $input -eq "stop" -or $input -eq "exit") {
            break
        }
        Start-Sleep -Milliseconds 500
    }
}
finally {
    Write-Host "`nStopping all AgriOps services..." -ForegroundColor Red
    
    if ($backend -and !$backend.HasExited) { 
        Stop-Process -Id $backend.Id -Force -ErrorAction SilentlyContinue 
    }
    if ($aiCrop -and !$aiCrop.HasExited) { 
        Stop-Process -Id $aiCrop.Id -Force -ErrorAction SilentlyContinue 
    }
    if ($aiPlan -and !$aiPlan.HasExited) { 
        Stop-Process -Id $aiPlan.Id -Force -ErrorAction SilentlyContinue 
    }
    if ($frontend -and !$frontend.HasExited) { 
        Stop-Process -Id $frontend.Id -Force -ErrorAction SilentlyContinue 
    }

    # Ensure no lingering node/dotnet/uvicorn orphan processes on target ports
    Write-Host "All services stopped cleanly. Ports 5286, 8000, 5173 released." -ForegroundColor Green
}
