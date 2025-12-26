@echo off
REM Change to script directory
cd /d "%~dp0"

echo ========================================
echo   Give Admin Full Access to All Permissions
echo ========================================
echo.

REM Use Session Pooler for scripts (better for queries)
set DIRECT_URL=postgresql://postgres.xvpjqmftyqipyqomnkgm:M00243540000m@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres
set DATABASE_URL=%DIRECT_URL%

echo This will:
echo 1. Find or create admin role
echo 2. Add ALL permissions to admin role
echo 3. Verify admin has full access
echo.
echo Press any key to continue...
pause

echo.
echo Giving admin full access...
echo.

call npx tsx scripts/give-admin-full-access.ts

if errorlevel 1 (
    echo.
    echo ========================================
    echo   Error occurred!
    echo ========================================
    echo.
    echo Please check the error messages above.
    pause
    exit /b 1
)

echo.
echo ========================================
echo   Done!
echo ========================================
echo.
echo Admin now has full access to all permissions.
echo You may need to logout and login again for changes to take effect.
echo.
pause

