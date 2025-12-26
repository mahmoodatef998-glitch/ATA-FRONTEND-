@echo off
REM Change to script directory
cd /d "%~dp0"

echo ========================================
echo   Check .env File
echo ========================================
echo.

if exist ".env" (
    echo ✅ .env file found!
    echo.
    echo Checking DATABASE_URL in .env:
    echo.
    findstr /C:"DATABASE_URL" .env
    echo.
    echo ⚠️  If DATABASE_URL is set in .env, it will override environment variables!
    echo    You may need to update it or remove it.
    echo.
) else (
    echo ❌ No .env file found.
    echo    This is OK - Prisma will use environment variables.
    echo.
)

echo.
pause

