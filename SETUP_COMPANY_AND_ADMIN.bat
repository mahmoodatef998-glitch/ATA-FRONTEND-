@echo off
REM Change to script directory
cd /d "%~dp0"

echo ========================================
echo   Setup Company and Admin
echo ========================================
echo.

REM Use Session Pooler for scripts (better for queries)
set DIRECT_URL=postgresql://postgres.xvpjqmftyqipyqomnkgm:M00243540000m@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres
set DATABASE_URL=%DIRECT_URL%

echo This will:
echo 1. Create default company (ATA Generators ^& Parts)
echo 2. Create admin user (admin@demo.co)
echo.
echo Press any key to continue...
pause

echo.
echo Setting up company and admin...
echo.

call npx tsx scripts/setup-company-and-admin.ts

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
echo   Setup Complete!
echo ========================================
echo.
echo You can now login with:
echo   Email: admin@demo.co
echo   Password: 00243540000
echo   URL: https://ata-frontend-pied.vercel.app/login
echo.
pause

