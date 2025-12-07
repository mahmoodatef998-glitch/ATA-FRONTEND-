@echo off
chcp 65001 >nul
echo ========================================
echo   Starting ATA CRM Project...
echo ========================================
echo.

REM Check if Node.js is installed
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if npm is installed
where npm >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] npm is not installed or not in PATH
    pause
    exit /b 1
)

echo [1/3] Starting Prisma Studio...
start "Prisma Studio" /min cmd /k "npm run prisma:studio"
timeout /t 3 /nobreak >nul

echo [2/3] Checking if port 3005 is available...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3005 ^| findstr LISTENING') do (
    echo Port 3005 is in use by process %%a. Stopping it...
    taskkill /F /PID %%a >nul 2>&1
    timeout /t 2 /nobreak >nul
)

echo Starting Next.js Development Server...
echo.
echo Waiting for server to start...
echo.

REM Start the development server in a new window
start "Next.js Dev Server" cmd /k "npm run dev"

REM Wait for server to be ready
echo Waiting for server to be ready...
timeout /t 8 /nobreak >nul

echo [3/3] Opening browser...
echo.

REM Open browser using PowerShell
powershell -Command "Start-Process 'http://localhost:3005'"

echo ========================================
echo   Server Started Successfully!
echo ========================================
echo.
echo Frontend: http://localhost:3005
echo Prisma Studio: http://localhost:5556
echo.
echo Press any key to close this window...
echo (The servers will continue running in separate windows)
pause >nul
