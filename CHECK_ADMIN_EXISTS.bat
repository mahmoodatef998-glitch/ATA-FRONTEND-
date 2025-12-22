@echo off
echo ========================================
echo   Check if Admin User Exists
echo ========================================
echo.

REM Set Database URL - Direct connection (for migrations and scripts)
set DIRECT_URL=postgresql://postgres:M00243540000m@db.xvpjqmftyqipyqomnkgm.supabase.co:5432/postgres

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

