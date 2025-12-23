@echo off
REM Change to script directory
cd /d "%~dp0"

echo ========================================
echo   Verify Roles Permissions
echo ========================================
echo.

REM Use Session Pooler for scripts (better for queries)
set DIRECT_URL=postgresql://postgres.xvpjqmftyqipyqomnkgm:M00243540000m@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres
set DATABASE_URL=%DIRECT_URL%

echo This will:
echo 1. Check each role against expected permissions
echo 2. Show missing permissions (if any)
echo 3. Show extra permissions (if any)
echo 4. Verify all roles are correct
echo.
echo Press any key to continue...
pause

echo.
echo Verifying roles permissions...
echo.

call npx tsx scripts/verify-roles-permissions.ts

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
pause

