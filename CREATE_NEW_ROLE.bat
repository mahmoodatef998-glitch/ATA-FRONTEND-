@echo off
echo ========================================
echo   Create New RBAC Role
echo ========================================
echo.

REM Use Session Pooler for scripts (better for queries)
set DIRECT_URL=postgresql://postgres.xvpjqmftyqipyqomnkgm:M00243540000m@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres

echo Enter Role Details:
echo.

set /p ROLE_NAME="Role Name (lowercase, use underscores, e.g., custom_role): "
set /p ROLE_DISPLAY_NAME="Display Name (e.g., Custom Role): "
set /p ROLE_DESCRIPTION="Description (optional, press Enter to skip): "

echo.
echo Company ID:
echo   1. Global Role (available to all companies)
echo   2. Company-Specific Role
echo.
set /p COMPANY_CHOICE="Select (1 or 2): "

if "%COMPANY_CHOICE%"=="1" (
    set COMPANY_ID=
    echo Creating Global Role...
) else if "%COMPANY_CHOICE%"=="2" (
    set /p COMPANY_ID="Enter Company ID (default: 1): "
    if "!COMPANY_ID!"=="" set COMPANY_ID=1
    echo Creating Company-Specific Role...
) else (
    set COMPANY_ID=
    echo Invalid choice, creating Global Role...
)

echo.
echo System Role?
echo   System roles cannot be deleted
echo.
set /p IS_SYSTEM="Is this a System Role? (y/n, default: n): "
if /i "%IS_SYSTEM%"=="y" (
    set IS_SYSTEM=true
) else (
    set IS_SYSTEM=false
)

echo.
echo ========================================
echo   Creating Role...
echo ========================================
echo.

call npx tsx scripts/create-role.ts

echo.
echo ========================================
echo   Done!
echo ========================================
echo.
echo Next Steps:
echo   1. Go to Dashboard ^> RBAC ^> Roles
echo   2. Assign permissions to this role
echo   3. Assign this role to users
echo.
pause

