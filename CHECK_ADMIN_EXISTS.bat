@echo off
REM Change to script directory
cd /d "%~dp0"

echo ========================================
echo   Check if Admin User Exists
echo ========================================
echo.

REM Set Database URL - Direct connection (for migrations and scripts)
REM ⚠️ IMPORTANT: Get the correct URL from Supabase Dashboard
REM Settings → Database → Connection string → URI
REM Format: postgresql://postgres.[PROJECT_REF]:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres
REM Replace [PROJECT_REF] with your actual project reference
set DIRECT_URL=postgresql://postgres.xvpjqmftyqipyqomnkgm:M00243540000m@db.xvpjqmftyqipyqomnkgm.supabase.co:5432/postgres

echo Checking database for admin user...
echo Database URL: %DIRECT_URL%
echo.

call npx tsx scripts/check-admin.ts

if errorlevel 1 (
    echo.
    echo ========================================
    echo   Error occurred!
    echo ========================================
    echo.
    echo Possible issues:
    echo   1. Database URL incorrect
    echo   2. Database credentials wrong
    echo   3. Database not accessible
    echo.
    echo Please check:
    echo   - DIRECT_URL is correct
    echo   - Database password is correct
    echo   - Database is accessible
    echo.
)

echo.
pause

