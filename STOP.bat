@echo off
chcp 65001 >nul
echo ========================================
echo   Stopping ATA CRM Project...
echo ========================================
echo.

echo [1/2] Stopping Node.js processes on port 3005...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3005 ^| findstr LISTENING') do (
    echo Killing process %%a...
    taskkill /F /PID %%a >nul 2>&1
)

echo [2/2] Stopping Prisma Studio on port 5556...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5556 ^| findstr LISTENING') do (
    echo Killing process %%a...
    taskkill /F /PID %%a >nul 2>&1
)

echo.
echo Stopping all Node.js processes...
taskkill /F /IM node.exe >nul 2>&1
taskkill /F /IM tsx.exe >nul 2>&1

echo.
echo ========================================
echo   All servers stopped!
echo ========================================
echo.
timeout /t 2 /nobreak >nul
