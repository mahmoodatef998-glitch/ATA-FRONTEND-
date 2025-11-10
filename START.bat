@echo off
title ATA CRM - Starting
color 0A

echo.
echo ========================================
echo    Starting ATA CRM System
echo ========================================
echo.

cd /d "%~dp0"

REM Stop old processes
echo Cleaning old processes...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 >nul
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 >nul
echo Done.
echo.

REM Check Docker
echo Checking Docker...
docker ps >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Docker not running!
    echo Please start Docker Desktop first.
    pause
    exit /b 1
)
echo Docker OK.
echo.

REM Start PostgreSQL
echo Starting PostgreSQL...
docker-compose up -d >nul 2>&1
timeout /t 5 >nul
echo PostgreSQL OK.
echo.

REM Generate Prisma
echo Preparing Prisma...
call npx prisma generate >nul 2>&1
echo Prisma OK.
echo.

REM Start services
echo Starting Prisma Studio (blue window)...
start cmd /k "color 0B && npx prisma studio --port 5556"
timeout /t 2 >nul

echo Starting Next.js (green window)...
start cmd /k "color 0A && npm run dev"
timeout /t 2 >nul

echo.
echo ========================================
echo    Waiting for servers (15 sec)...
echo ========================================
timeout /t 15 >nul

echo Opening browser...
start http://localhost:3005

echo.
echo ========================================
echo    SUCCESS!
echo ========================================
echo.
echo Services:
echo   Next.js:  http://localhost:3005
echo   Prisma:   http://localhost:5556
echo.
echo Admin Login:
echo   admin@demo.co / 00243540000
echo.
echo ========================================
echo.
pause
