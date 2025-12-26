@echo off
REM Change to script directory
cd /d "%~dp0"

echo ========================================
echo   Create New Admin User
echo ========================================
echo.

REM Use Session Pooler for scripts (better for queries)
set DIRECT_URL=postgresql://postgres.xvpjqmftyqipyqomnkgm:M00243540000m@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres

set /p USER_NAME="Enter Admin Name: "
set /p USER_EMAIL="Enter Admin Email: "
set /p USER_PASSWORD="Enter Password (min 8 chars): "
set USER_ROLE=ADMIN
set COMPANY_ID=1

echo.
echo Creating admin user...
echo.

call npx tsx scripts/create-user.ts

echo.
echo ========================================
echo   Done!
echo ========================================
echo.
echo Login with:
echo   Email: %USER_EMAIL%
echo   Password: [Your entered password]
echo.
pause

