@echo off
echo ========================================
echo   Create Admin User - Quick Setup
echo ========================================
echo.

set DIRECT_URL=postgresql://postgres.xvpjqmftyqipyqomnkgm:M00243540000m@db.xvpjqmftyqipyqomnkgm.supabase.co:5432/postgres

echo Creating admin user...
echo Email: admin@demo.co
echo Password: 00243540000
echo.

set USER_NAME=Admin User
set USER_EMAIL=admin@demo.co
set USER_PASSWORD=00243540000
set USER_ROLE=ADMIN
set COMPANY_ID=1

call npx tsx scripts/create-user.ts

if errorlevel 1 (
    echo.
    echo ERROR: Failed to create user!
    echo Trying to update existing admin...
    echo.
    set ADMIN_EMAIL=admin@demo.co
    set ADMIN_PASSWORD=00243540000
    set ADMIN_NAME=Admin User
    call npx tsx scripts/update-admin.ts
)

echo.
echo ========================================
echo   Done!
echo ========================================
echo.
echo Login with:
echo   Email: admin@demo.co
echo   Password: 00243540000
echo.
pause

