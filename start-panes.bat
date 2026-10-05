@echo off
REM =========================================================================
REM Launch all AgriOps services tiled inside ONE Windows Terminal window
REM =========================================================================

REM Pane 1: Backend API
wt -d "%CD%" powershell -noExit -Command "Write-Host '=======================================' -ForegroundColor Cyan; Write-Host '  1. AgriOps ASP.NET Core Backend (5286)' -ForegroundColor Cyan; Write-Host '=======================================' -ForegroundColor Cyan; dotnet run --project backend/src/AgriOps.Api" `
; split-pane -V -d "%CD%" powershell -noExit -Command "Write-Host '=======================================' -ForegroundColor Magenta; Write-Host '  2. AgriOps AI Subsystem - Crop (8000)' -ForegroundColor Magenta; Write-Host '=======================================' -ForegroundColor Magenta; .venv\Scripts\python -m uvicorn main:app --app-dir ai-subsystem --port 8000 --reload" `
; split-pane -H -d "%CD%" powershell -noExit -Command "Write-Host '=======================================' -ForegroundColor DarkMagenta; Write-Host '  3. Farm Planning AI Agent (8001)' -ForegroundColor DarkMagenta; Write-Host '=======================================' -ForegroundColor DarkMagenta; .venv\Scripts\python -m uvicorn app.main:app --app-dir agents/farm-planning-agent --port 8001 --reload" `
; split-pane -H -d "%CD%" powershell -noExit -Command "Write-Host '=======================================' -ForegroundColor Yellow; Write-Host '  4. AgriOps React Dashboard (5173)' -ForegroundColor Yellow; Write-Host '=======================================' -ForegroundColor Yellow; npm run dev --prefix frontend-web"
