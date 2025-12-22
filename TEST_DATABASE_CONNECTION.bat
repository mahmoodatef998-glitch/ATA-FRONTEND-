@echo off
REM Change to script directory
cd /d "%~dp0"

echo ========================================
echo   Test Database Connection
echo ========================================
echo.

set DIRECT_URL=postgresql://postgres:M00243540000m@db.xvpjqmftyqipyqomnkgm.supabase.co:5432/postgres

echo Testing database connection...
echo Database URL: %DIRECT_URL%
echo.

echo Step 1: Testing Prisma connection...
echo.

call npx tsx scripts/test-connection.ts

if errorlevel 1 (
    echo.
    echo ========================================
    echo   Connection Failed!
    echo ========================================
    echo.
    echo Please check the error message above.
    echo.
) else (
    echo.
    echo ========================================
    echo   Connection Successful!
    echo ========================================
    echo.
    echo Now you can run:
    echo   CHECK_ADMIN_EXISTS.bat
    echo.
)

echo.
pause
