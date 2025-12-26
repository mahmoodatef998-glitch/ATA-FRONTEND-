@echo off
echo ========================================
echo   Create New RBAC Role (Simple)
echo ========================================
echo.

REM Use Session Pooler for scripts (better for queries)
set DIRECT_URL=postgresql://postgres.xvpjqmftyqipyqomnkgm:M00243540000m@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres

set /p ROLE_NAME="Role Name (lowercase, underscores, e.g., sales_manager): "
set /p ROLE_DISPLAY_NAME="Display Name (e.g., Sales Manager): "
set /p ROLE_DESCRIPTION="Description (optional): "
set /p COMPANY_ID="Company ID (press Enter for Global Role): "

if "%COMPANY_ID%"=="" set COMPANY_ID=

echo.
echo Creating role...
call npx tsx scripts/create-role.ts

echo.
pause

