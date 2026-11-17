<#
.SYNOPSIS
    TravelAI Monorepo Management & Execution Script
.DESCRIPTION
    Launches FastAPI Backend, React Frontend, runs tests, or syncs to GitHub.
.EXAMPLE
    .\run.ps1
    .\run.ps1 -Command all
    .\run.ps1 -Command backend
    .\run.ps1 -Command frontend
    .\run.ps1 -Command test
    .\run.ps1 -Command push
#>

param (
    [Parameter(Position = 0)]
    [ValidateSet("all", "backend", "frontend", "test", "push", "menu")]
    [string]$Command = "menu"
)

$ProjectRoot = $PSScriptRoot
if ([string]::IsNullOrWhiteSpace($ProjectRoot)) {
    $ProjectRoot = (Get-Location).Path
}
Set-Location $ProjectRoot

$BackendDir = Join-Path $ProjectRoot "backend"
$FrontendDir = Join-Path $ProjectRoot "frontend"

function Show-Header {
    Clear-Host
    Write-Host "======================================================================" -ForegroundColor Cyan
    Write-Host "                   TravelAI Platform Launcher (PS)                    " -ForegroundColor Cyan
    Write-Host "======================================================================" -ForegroundColor Cyan
    Write-Host "Project Root: $ProjectRoot`n" -ForegroundColor DarkGray
}

function Initialize-BackendEnvironment {
    $venvPy = Join-Path $BackendDir "venv\Scripts\python.exe"
    if (-not (Test-Path $venvPy)) {
        Write-Host "[!] Creating backend virtual environment..." -ForegroundColor Yellow
        & python -m venv "$BackendDir\venv"
    }
    $venvPip = Join-Path $BackendDir "venv\Scripts\pip.exe"
    if (Test-Path $venvPip) {
        # Ensure uvicorn and fastapi are installed
        $checkUvicorn = Join-Path $BackendDir "venv\Scripts\uvicorn.exe"
        if (-not (Test-Path $checkUvicorn)) {
            Write-Host "[!] Installing backend Python requirements..." -ForegroundColor Yellow
            & $venvPip install -r "$BackendDir\requirements.txt"
        }
    }
}

function Initialize-FrontendEnvironment {
    $nodeModules = Join-Path $FrontendDir "node_modules"
    if (-not (Test-Path $nodeModules)) {
        Write-Host "[!] Installing frontend npm dependencies..." -ForegroundColor Yellow
        Push-Location $FrontendDir
        & npm.cmd install
        Pop-Location
    }
}

function Start-AllServices {
    Write-Host "`n[*] Preparing full TravelAI platform..." -ForegroundColor Green
    Initialize-BackendEnvironment
    Initialize-FrontendEnvironment

    $venvPy = Join-Path $BackendDir "venv\Scripts\python.exe"
    $pyExe = if (Test-Path $venvPy) { "`"$venvPy`"" } else { "python" }

    Write-Host "[*] Launching FastAPI Backend (http://localhost:8000)..." -ForegroundColor Cyan
    Start-Process -FilePath "cmd.exe" -ArgumentList "/k", "cd /d `"$BackendDir`" && $pyExe run.py" -WorkingDirectory $BackendDir

    Start-Sleep -Seconds 2

    Write-Host "[*] Launching React Vite Frontend (http://localhost:5173)..." -ForegroundColor Cyan
    Start-Process -FilePath "cmd.exe" -ArgumentList "/k", "cd /d `"$FrontendDir`" && npm.cmd run dev" -WorkingDirectory $FrontendDir

    Start-Sleep -Seconds 2
    Start-Process "http://localhost:5173"

    Write-Host "`n======================================================================" -ForegroundColor Green
    Write-Host " TravelAI services are now running!" -ForegroundColor Green
    Write-Host " - Frontend Web App:  http://localhost:5173" -ForegroundColor White
    Write-Host " - Backend API:       http://localhost:8000" -ForegroundColor White
    Write-Host " - Interactive Docs:  http://localhost:8000/docs" -ForegroundColor White
    Write-Host " - Health Endpoint:   http://localhost:8000/api/v1/health" -ForegroundColor White
    Write-Host "======================================================================`n" -ForegroundColor Green
}

function Start-BackendOnly {
    Initialize-BackendEnvironment
    $venvPy = Join-Path $BackendDir "venv\Scripts\python.exe"
    $pyExe = if (Test-Path $venvPy) { "`"$venvPy`"" } else { "python" }

    Write-Host "`n[*] Launching FastAPI Backend only (http://localhost:8000)..." -ForegroundColor Cyan
    Start-Process -FilePath "cmd.exe" -ArgumentList "/k", "cd /d `"$BackendDir`" && $pyExe run.py" -WorkingDirectory $BackendDir
}

function Start-FrontendOnly {
    Initialize-FrontendEnvironment
    Write-Host "`n[*] Launching Frontend only (http://localhost:5173)..." -ForegroundColor Cyan
    Start-Process -FilePath "cmd.exe" -ArgumentList "/k", "cd /d `"$FrontendDir`" && npm.cmd run dev" -WorkingDirectory $FrontendDir
}

function Invoke-Pytest {
    Initialize-BackendEnvironment
    Write-Host "`n[*] Running backend tests..." -ForegroundColor Yellow
    $pytestPath = Join-Path $BackendDir "venv\Scripts\pytest.exe"
    Push-Location $BackendDir
    if (Test-Path $pytestPath) {
        & $pytestPath -v tests
    }
    else {
        & python -m pytest -v tests
    }
    Pop-Location
}

function Push-ToGitHub {
    Write-Host "`n======================================================================" -ForegroundColor Magenta
    Write-Host "                    GitHub Push Assistant                             " -ForegroundColor Magenta
    Write-Host "======================================================================" -ForegroundColor Magenta
    git status -s
    $msg = Read-Host "`nEnter commit message (leave empty for 'Update project files and documentation')"
    if ([string]::IsNullOrWhiteSpace($msg)) {
        $msg = "Update project files and documentation"
    }

    Write-Host "`n[*] Staging all files..." -ForegroundColor Cyan
    git add .

    Write-Host "[*] Committing changes..." -ForegroundColor Cyan
    git commit -m "$msg"

    Write-Host "[*] Pushing to origin main..." -ForegroundColor Cyan
    git push origin main

    Write-Host "`n[+] Push completed successfully!" -ForegroundColor Green
}

switch ($Command.ToLower()) {
    "all" { Start-AllServices }
    "backend" { Start-BackendOnly }
    "frontend" { Start-FrontendOnly }
    "test" { Invoke-Pytest }
    "push" { Push-ToGitHub }
    "menu" {
        while ($true) {
            Show-Header
            Write-Host "Please select an option:"
            Write-Host "  [1] Start Both Backend and Frontend (Recommended)" -ForegroundColor Green
            Write-Host "  [2] Start Backend Only (FastAPI on http://localhost:8000)"
            Write-Host "  [3] Start Frontend Only (Vite React on http://localhost:5173)"
            Write-Host "  [4] Run Backend Tests (pytest)"
            Write-Host "  [5] Push Changes to GitHub" -ForegroundColor Magenta
            Write-Host "  [6] Exit"
            Write-Host "======================================================================"
            $choice = Read-Host "Enter choice [1-6] (Default 1)"
            if ([string]::IsNullOrWhiteSpace($choice)) { $choice = "1" }

            switch ($choice) {
                "1" { Start-AllServices; Read-Host "`nPress Enter to return to menu..." }
                "2" { Start-BackendOnly; Read-Host "`nPress Enter to return to menu..." }
                "3" { Start-FrontendOnly; Read-Host "`nPress Enter to return to menu..." }
                "4" { Invoke-Pytest; Read-Host "`nPress Enter to return to menu..." }
                "5" { Push-ToGitHub; Read-Host "`nPress Enter to return to menu..." }
                "6" { Write-Host "Goodbye!"; return }
                default { Write-Host "Invalid option. Please try again." -ForegroundColor Red; Start-Sleep -Seconds 1 }
            }
        }
    }
}
