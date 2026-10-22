@echo off
setlocal enabledelayedexpansion
title TravelAI Platform Launcher

:: Get project root directory (properly quoted to handle spaces)
set "PROJECT_ROOT=%~dp0"
cd /d "%PROJECT_ROOT%"

:: Check if called with arguments
set "ARG=%~1"
if not "%ARG%"=="" (
    set "INTERACTIVE=0"
    if /i "%ARG%"=="all" goto :start_all
    if /i "%ARG%"=="dev" goto :start_all
    if /i "%ARG%"=="backend" goto :start_backend
    if /i "%ARG%"=="frontend" goto :start_frontend
    if /i "%ARG%"=="test" goto :run_tests
    if /i "%ARG%"=="tests" goto :run_tests
    if /i "%ARG%"=="push" goto :git_push
    echo Unknown command: %ARG%
    echo Available commands: all, backend, frontend, test, push
    exit /b 1
)

set "INTERACTIVE=1"

:menu
cls
echo ======================================================================
echo                     TravelAI Platform Launcher
echo ======================================================================
echo Project Root: %PROJECT_ROOT%
echo.
echo Please select an option:
echo   [1] Start Both (Backend + Frontend) (Recommended)
echo   [2] Start FastAPI Backend Only      (http://localhost:8000)
echo   [3] Start React Frontend Only       (http://localhost:5173)
echo   [4] Run Automated Tests             (pytest)
echo   [5] Push to GitHub                  (git add, commit, push)
echo   [6] Exit
echo ======================================================================
echo.
set /p choice="Enter choice [1-6] (Default is 1): "
if "%choice%"=="" set choice=1
if "%choice%"=="1" goto :start_all
if "%choice%"=="2" goto :start_backend
if "%choice%"=="3" goto :start_frontend
if "%choice%"=="4" goto :run_tests
if "%choice%"=="5" goto :git_push
if "%choice%"=="6" goto :exit_launcher

echo.
echo [!] Invalid selection "%choice%". Please enter 1, 2, 3, 4, 5, or 6.
timeout /t 2 >nul
goto :menu

:start_all
echo.
echo [*] Launching TravelAI Full Platform...
echo [*] Checking Backend virtual environment...
if not exist "%PROJECT_ROOT%backend\venv\Scripts\python.exe" (
    echo [!] Backend virtual environment not found. Creating venv...
    cd /d "%PROJECT_ROOT%backend"
    python -m venv venv
    call venv\Scripts\activate.bat
    pip install -r requirements.txt
    cd /d "%PROJECT_ROOT%"
)

echo [*] Checking Frontend dependencies...
if not exist "%PROJECT_ROOT%frontend\node_modules" (
    echo [!] Frontend node_modules not found. Running npm install...
    cd /d "%PROJECT_ROOT%frontend"
    call npm install
    cd /d "%PROJECT_ROOT%"
)

echo.
echo [*] Starting FastAPI Backend on port 8000 in a new window...
start "TravelAI - FastAPI Backend (Port 8000)" /d "%PROJECT_ROOT%backend" cmd /k "call venv\Scripts\activate.bat && python run.py"

echo [*] Waiting for Backend to initialize...
timeout /t 3 /nobreak >nul

echo [*] Starting React + Vite Frontend on port 5173 in a new window...
start "TravelAI - Vite React Frontend (Port 5173)" /d "%PROJECT_ROOT%frontend" cmd /k "npm run dev"

echo.
echo ======================================================================
echo  TravelAI services are now running!
echo  - Backend API:       http://localhost:8000
echo  - Interactive Docs:  http://localhost:8000/docs
echo  - Health Endpoint:   http://localhost:8000/api/v1/health
echo  - Frontend Web App:  http://localhost:5173
echo ======================================================================
echo.
if "%INTERACTIVE%"=="1" (
    echo You can keep this launcher window open, or close it anytime.
    pause
    goto :menu
)
exit /b 0

:start_backend
echo.
echo [*] Starting FastAPI Backend only...
if not exist "%PROJECT_ROOT%backend\venv\Scripts\python.exe" (
    echo [!] Creating backend venv first...
    cd /d "%PROJECT_ROOT%backend"
    python -m venv venv
    call venv\Scripts\activate.bat
    pip install -r requirements.txt
    cd /d "%PROJECT_ROOT%"
)
start "TravelAI - FastAPI Backend (Port 8000)" /d "%PROJECT_ROOT%backend" cmd /k "call venv\Scripts\activate.bat && python run.py"
echo Backend window started at http://localhost:8000
if "%INTERACTIVE%"=="1" (
    pause
    goto :menu
)
exit /b 0

:start_frontend
echo.
echo [*] Starting React + Vite Frontend only...
if not exist "%PROJECT_ROOT%frontend\node_modules" (
    echo [!] Running npm install...
    cd /d "%PROJECT_ROOT%frontend"
    call npm install
    cd /d "%PROJECT_ROOT%"
)
start "TravelAI - Vite React Frontend (Port 5173)" /d "%PROJECT_ROOT%frontend" cmd /k "npm run dev"
echo Frontend window started at http://localhost:5173
if "%INTERACTIVE%"=="1" (
    pause
    goto :menu
)
exit /b 0

:run_tests
echo.
echo [*] Running automated tests with pytest...
cd /d "%PROJECT_ROOT%backend"
if exist "venv\Scripts\pytest.exe" (
    venv\Scripts\pytest.exe -v tests
) else (
    pytest -v tests
)
cd /d "%PROJECT_ROOT%"
echo.
if "%INTERACTIVE%"=="1" (
    pause
    goto :menu
)
exit /b 0

:git_push
echo.
echo ======================================================================
echo                    GitHub Push Assistant
echo ======================================================================
cd /d "%PROJECT_ROOT%"
echo Current Git Status:
git status -s
echo.
if "%INTERACTIVE%"=="1" (
    set /p commit_msg="Enter commit message (Leave empty for 'Update project files and documentation'): "
) else (
    set "commit_msg=%~2"
)
if "!commit_msg!"=="" set commit_msg=Update project files and documentation

echo.
echo [*] Staging all files...
git add .

echo [*] Committing changes...
git commit -m "!commit_msg!"

echo [*] Pushing to origin main...
git push origin main

echo.
echo [+] Git push operation completed!
if "%INTERACTIVE%"=="1" (
    pause
    goto :menu
)
exit /b 0

:exit_launcher
echo Exiting TravelAI Launcher. Goodbye!
exit /b 0
