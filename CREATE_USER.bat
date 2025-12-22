@echo off
echo ========================================
echo   Create New User
echo ========================================
echo.

REM Use Session Pooler for scripts (better for queries)
set DIRECT_URL=postgresql://postgres.xvpjqmftyqipyqomnkgm:M00243540000m@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres

set /p USER_NAME="Enter Name: "
set /p USER_EMAIL="Enter Email: "
set /p USER_PASSWORD="Enter Password (min 8 chars): "
echo.
echo Available Roles:
echo   1. ADMIN
echo   2. OPERATIONS_MANAGER
echo   3. ACCOUNTANT
echo   4. SUPERVISOR
echo   5. TECHNICIAN
echo   6. FACTORY_SUPERVISOR
echo   7. HR
echo   8. SALES_REP
echo   9. CLIENT
echo.
set /p ROLE_CHOICE="Select Role (1-9): "

if "%ROLE_CHOICE%"=="1" set USER_ROLE=ADMIN
if "%ROLE_CHOICE%"=="2" set USER_ROLE=OPERATIONS_MANAGER
if "%ROLE_CHOICE%"=="3" set USER_ROLE=ACCOUNTANT
if "%ROLE_CHOICE%"=="4" set USER_ROLE=SUPERVISOR
if "%ROLE_CHOICE%"=="5" set USER_ROLE=TECHNICIAN
if "%ROLE_CHOICE%"=="6" set USER_ROLE=FACTORY_SUPERVISOR
if "%ROLE_CHOICE%"=="7" set USER_ROLE=HR
if "%ROLE_CHOICE%"=="8" set USER_ROLE=SALES_REP
if "%ROLE_CHOICE%"=="9" set USER_ROLE=CLIENT

set COMPANY_ID=1

echo.
echo Creating user...
echo.

call npx tsx scripts/create-user.ts

echo.
echo ========================================
echo   Done!
echo ========================================
echo.
pause

