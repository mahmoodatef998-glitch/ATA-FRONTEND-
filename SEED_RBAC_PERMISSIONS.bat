@echo off
REM Change to script directory
cd /d "%~dp0"

echo ========================================
echo   Seed RBAC Permissions and Roles
echo ========================================
echo.

REM Use Session Pooler for scripts (better for queries)
set DIRECT_URL=postgresql://postgres.xvpjqmftyqipyqomnkgm:M00243540000m@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres
set DATABASE_URL=%DIRECT_URL%

echo This will:
echo 1. Create all permissions in database
echo 2. Create all system roles (admin, operation_manager, etc.)
echo 3. Assign permissions to roles
echo.
echo ⚠️  This will create/update permissions and roles in your database.
echo.
echo Press any key to continue...
pause

echo.
echo Seeding RBAC permissions and roles...
echo.

call npx tsx prisma/seed-rbac.ts

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
echo RBAC permissions and roles have been seeded.
echo Now you can run: FIX_ADMIN_PERMISSIONS.bat
echo.
pause

