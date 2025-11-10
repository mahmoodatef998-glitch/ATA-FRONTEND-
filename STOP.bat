@echo off
title ATA CRM - Stopping
color 0C

echo.
echo ========================================
echo    Stopping ATA CRM
echo ========================================
echo.

echo Stopping all Node processes...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 >nul
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 >nul
echo Done.

echo.
echo Do you want to stop PostgreSQL too?
choice /C YN /M "Stop PostgreSQL (Y/N)"

if errorlevel 2 goto :no
if errorlevel 1 goto :yes

:yes
cd /d "%~dp0"
docker-compose down
echo PostgreSQL stopped.
goto :end

:no
echo PostgreSQL kept running.
goto :end

:end
echo.
echo ========================================
echo    Stopped!
echo ========================================
echo.
pause
