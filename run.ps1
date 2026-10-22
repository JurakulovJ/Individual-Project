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
Set-Location $ProjectRoot

function Show-Header {
    Clear-Host
    Write-Host "======================================================================" -ForegroundColor Cyan
    Write-Host "                   TravelAI Platform Launcher (PS)                    " -ForegroundColor Cyan
    Write-Host "======================================================================" -ForegroundColor Cyan
    Write-Host "Project Root: $ProjectRoot`n" -ForegroundColor DarkGray
}

function Start-AllServices {
    Write-Host "`n[*] Starting full TravelAI platform..." -ForegroundColor Green
    
    # Check venv
    $venvPy = Join-Path $ProjectRoot "backend\venv\Scripts\python.exe"
    if (-not (Test-Path $venvPy)) {
        Write-Host "[!] Creating backend virtual environment..." -ForegroundColor Yellow
        Start-Process -FilePath "python" -ArgumentList "-m venv backend\venv" -Wait -NoNewWindow
        $venvPip = Join-Path $ProjectRoot "backend\venv\Scripts\pip.exe"
        Start-Process -FilePath $venvPip -ArgumentList "install -r backend\requirements.txt" -Wait -NoNewWindow
    }

    # Check node_modules
    $nodeModules = Join-Path $ProjectRoot "frontend\node_modules"
    if (-not (Test-Path $nodeModules)) {
        Write-Host "[!] Installing frontend dependencies..." -ForegroundColor Yellow
        Start-Process -FilePath "npm" -ArgumentList "install" -WorkingDirectory (Join-Path $ProjectRoot "frontend") -Wait -NoNewWindow
    }

    Write-Host "[*] Launching FastAPI Backend (Port 8000)..." -ForegroundColor Cyan
    Start-Process -FilePath "cmd.exe" -ArgumentList "/k", "call venv\Scripts\activate.bat && python run.py" -WorkingDirectory (Join-Path $ProjectRoot "backend")
    
    Start-Sleep -Seconds 2

    Write-Host "[*] Launching React Frontend (Port 5173)..." -ForegroundColor Cyan
    Start-Process -FilePath "cmd.exe" -ArgumentList "/k", "npm run dev" -WorkingDirectory (Join-Path $ProjectRoot "frontend")

    Write-Host "`n======================================================================" -ForegroundColor Green
    Write-Host " TravelAI services are now running!" -ForegroundColor Green
    Write-Host " - Backend API:       http://localhost:8000" -ForegroundColor White
    Write-Host " - Interactive Docs:  http://localhost:8000/docs" -ForegroundColor White
    Write-Host " - Health Endpoint:   http://localhost:8000/api/v1/health" -ForegroundColor White
    Write-Host " - Frontend Web App:  http://localhost:5173" -ForegroundColor White
    Write-Host "======================================================================`n" -ForegroundColor Green
}

function Start-BackendOnly {
    Write-Host "`n[*] Launching FastAPI Backend only..." -ForegroundColor Cyan
    Start-Process -FilePath "cmd.exe" -ArgumentList "/k", "call venv\Scripts\activate.bat && python run.py" -WorkingDirectory (Join-Path $ProjectRoot "backend")
}

function Start-FrontendOnly {
    Write-Host "`n[*] Launching Frontend only..." -ForegroundColor Cyan
    Start-Process -FilePath "cmd.exe" -ArgumentList "/k", "npm run dev" -WorkingDirectory (Join-Path $ProjectRoot "frontend")
}

function Invoke-Pytest {
    Write-Host "`n[*] Running tests..." -ForegroundColor Yellow
    $pytestPath = Join-Path $ProjectRoot "backend\venv\Scripts\pytest.exe"
    if (Test-Path $pytestPath) {
        & $pytestPath -v (Join-Path $ProjectRoot "backend\tests")
    } else {
        pytest -v backend\tests
    }
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
    "all"      { Start-AllServices }
    "backend"  { Start-BackendOnly }
    "frontend" { Start-FrontendOnly }
    "test"     { Invoke-Pytest }
    "push"     { Push-ToGitHub }
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
